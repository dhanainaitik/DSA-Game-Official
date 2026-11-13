import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Send, Plus, ChevronDown, ChevronUp, Lightbulb, CheckCircle2, XCircle, AlertCircle, Shield, Zap, Backpack } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cppLanguageSupport, cLanguageSupport } from '../../utils/cppAutocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { motion, AnimatePresence } from 'framer-motion';
import { getProblem, getState, getStarterCode } from '../../data/problems';
import { getRegionById } from '../../data/regions';
import { getEnemyForProblem } from '../../data/enemies';
import { ITEMS, RARITY_COLORS } from '../../data/items';
import { getProblemHint } from '../../data/hints';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { runCode } from '../../utils/codeRunner';
import { apiUrl } from '../../utils/api';
import { safeParseApiResponse } from '../../utils/apiResponseHandler';
import { triggerGoblinDefeatEffects, preloadGoblinAudio } from '../../utils/goblinEffects';
import { playVictoryCrowdCheer, preloadVictorySound, stopVictoryCrowdCheer } from '../../utils/victorySound';
import { diagnoseSubmissionForCodoGuide, runStaticDiagnostics } from '../../utils/codoGuideAnalyzer';
import gsap from 'gsap';
import AICompanion from '../../components/Battle/AICompanion';
import TestCasesPanel from './TestCasesPanel';

import charNormalImg from '../../../charcters/char/char.png';
import charDamagedImg from '../../../charcters/char/damged char.png';
import goblinNormalImg from '../../../charcters/goblin/goblin.png';
import goblinDamagedImg from '../../../charcters/goblin/damaged.png';

import './Question.css';

const DIFFICULTY_LABELS = {
  Easy: 'easy',
  'Easy-Medium': 'easy',
  Medium: 'medium',
  'Medium-Hard': 'medium',
  Hard: 'hard',
};

export default function Question() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const problem = getProblem(problemId);
  const { progress, markSolved, calculateRewards, useItem, getInventoryList, activateBuff, isBuffActive } = useProgress();

  const [selectedLang, setSelectedLang] = useState('javascript');
  const [codesByLanguage, setCodesByLanguage] = useState({});
  const [code, setCode] = useState('');
  const [testCases, setTestCases] = useState(problem?.testCases || []);
  const [runResults, setRunResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);

  const { user } = useAuth();
  const { isDark } = useTheme();

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockedHint, setUnlockedHint] = useState(null);

  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [showAddCase, setShowAddCase] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const panelRef = useRef(null);

  // Clear unlocked hint and reset language caches when switching questions & preload sounds
  useEffect(() => {
    setCodesByLanguage({});
    setUnlockedHint(null);
    preloadGoblinAudio();
    preloadVictorySound();
    setShowCompanion(false);
    setCompanionGuide(null);
    hasEncouragedTypingRef.current = false;
    setRunResults(null);
    setSubmitResult(null);
    setAiFeedback(null);
    setTestCases(problem?.testCases || []);

    return () => {
      stopVictoryCrowdCheer();
    };
  }, [problemId]);

  // V3 Battle State
  const enemy = getEnemyForProblem(problem?.regionId, problem?.difficulty);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(enemy?.baseHp || 500);
  const [combatText, setCombatText] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [floatingDamage, setFloatingDamage] = useState([]);
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionGuide, setCompanionGuide] = useState(null);
  const [damageDealt, setDamageDealt] = useState(0);

  const lastGuideTriggerRef = useRef({ category: null, time: 0 });
  const hasEncouragedTypingRef = useRef(false);
  const companionHideTimerRef = useRef(null);

  const showCodoGuide = (diag, { force = false, autoHideMs = 0 } = {}) => {
    if (!diag || !diag.message) return;
    const now = Date.now();

    if (!force) {
      // Passive cooldown: prevent nagging on the same error or too frequently
      if (
        diag.category === lastGuideTriggerRef.current.category &&
        now - lastGuideTriggerRef.current.time < 22000
      ) {
        return;
      }
      if (now - lastGuideTriggerRef.current.time < 7000) {
        return;
      }
    }

    if (companionHideTimerRef.current) {
      clearTimeout(companionHideTimerRef.current);
      companionHideTimerRef.current = null;
    }

    lastGuideTriggerRef.current = { category: diag.category, time: now };
    setCompanionGuide(diag);
    setShowCompanion(true);

    if (autoHideMs > 0) {
      companionHideTimerRef.current = setTimeout(() => {
        setShowCompanion(false);
      }, autoHideMs);
    }
  };

  // Gentle idle / passive syntax assistant (debounced — never interrupts active typing)
  useEffect(() => {
    if (!problem || isRunning || isSubmitting) return;

    const starter = getStarterCode(problem, selectedLang);
    const trimmed = code.trim();

    const timer = setTimeout(() => {
      // 1. Editor completely empty after pause
      if (!trimmed) {
        showCodoGuide(
          {
            category: 'idle_empty',
            message: 'Come on! Start typing your solution — the editor is waiting!',
            nextStep: null,
            severity: 'info',
          },
          { autoHideMs: 4500 }
        );
        return;
      }

      // 2. Real syntax mistake detected after pause (skip incomplete body/return while still typing)
      const staticDiag = runStaticDiagnostics(code, selectedLang);
      if (
        staticDiag &&
        staticDiag.severity === 'error' &&
        staticDiag.category !== 'empty_body' &&
        staticDiag.category !== 'empty_editor'
      ) {
        showCodoGuide(staticDiag);
        return;
      }

      // 3. First time user starts coding substantially without syntax errors
      if (!hasEncouragedTypingRef.current && trimmed !== starter.trim() && trimmed.length > starter.trim().length + 12) {
        hasEncouragedTypingRef.current = true;
        showCodoGuide(
          {
            category: 'typing_encourage',
            message: 'Nice! Keep going.',
            nextStep: null,
            severity: 'info',
          },
          { autoHideMs: 3200 }
        );
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [code, selectedLang, problemId, isRunning, isSubmitting]);

  // Inventory & Magic Items (single source of truth: ProgressContext)
  const inventory = getInventoryList();
  const [showInventory, setShowInventory] = useState(false);
  const [activeItems, setActiveItems] = useState({});
  const [usingItemId, setUsingItemId] = useState(null);

  // Dismiss inventory on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showInventory) {
        setShowInventory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInventory]);

  const handleUseItem = async (invItem) => {
    if (!invItem || usingItemId) return;
    const itemId = invItem.item_id || invItem.id;
    const slug = invItem.items?.slug || itemId;
    const itemName = invItem.items?.name || 'Item';

    console.log('[MagicBag Client] Trace Steps 1-4: USE button clicked', {
      invItem,
      slug,
      itemId,
      problemId,
      quantity: invItem.quantity,
      userId: user?.id || 'anonymous'
    });

    // 1. Guard against duplicate activation of active buffs
    if (
      (slug === 'retry_shield' && activeItems.retry_shield) ||
      (slug === 'lightning_flask' && activeItems.lightning_flask) ||
      (slug === 'focus_charm' && activeItems.focus_charm) ||
      (slug === 'shadow_veil' && activeItems.shadow_veil) ||
      (slug === 'xp_tome' && (activeItems.xp_tome || isBuffActive('xp_tome')))
    ) {
      showCombatText(`${itemName.toUpperCase()} ALREADY ACTIVE`, 'enemy-hit');
      return;
    }

    // 2. Hint Scroll: Must safely verify problem-specific hint exists BEFORE consuming
    if (slug === 'hint_scroll') {
      const hintText = getProblemHint(problemId, problem);
      if (!hintText) {
        showCombatText('No hint available for this problem', 'enemy-hit');
        return; // Do not consume scroll if hint is unavailable
      }

      setUsingItemId(invItem.id || slug);
      try {
        let remainingAfter = Math.max(0, invItem.quantity - 1);
        if (user?.id) {
          const token = await user.getToken();
          console.log('[MagicBag Client] Trace Step 5: Acquired Clerk token, dispatching /api/inventory/use');
          const response = await fetch(apiUrl('/api/inventory/use'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              itemId,
              itemSlug: slug,
              problemId,
              clientQty: invItem.quantity,
              context: { selectedLang }
            })
          });

          console.log('[MagicBag Client] Trace Step 10: Received response status:', response.status);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[MagicBag Client] Trace Step 10: Item use failed:', errData);
            showCombatText(errData.error || 'Failed to use Hint Scroll', 'enemy-hit');
            setUsingItemId(null);
            return;
          }

          const resData = await response.json();
          console.log('[MagicBag Client] Trace Step 10: Item use success:', resData);
          remainingAfter = resData.remainingQuantity ?? remainingAfter;
        }

        // Apply hint unlock and sync remaining item quantity (Bag stays open per UX spec)
        useItem(itemId, remainingAfter);
        setUnlockedHint(hintText);
        setShowCompanion(false); // Dismiss AI companion so it never covers the hint
        showCombatText('📜 HINT UNLOCKED!', 'player-hit');

        // Smooth scroll the hint into view in the left problem-description panel
        setTimeout(() => {
          const hintEl = document.getElementById('unlocked-hint-card');
          if (hintEl) {
            hintEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 120);

      } catch (err) {
        console.error('Error using hint scroll:', err);
        showCombatText('USAGE ERROR - ITEM PRESERVED', 'enemy-hit');
      } finally {
        setUsingItemId(null);
      }
      return;
    }

    // 3. Other Consumables & Boosts (Atomic Server-Validated Consumption)
    setUsingItemId(invItem.id || slug);
    try {
      let remainingAfter = Math.max(0, invItem.quantity - 1);
      if (user?.id) {
        const token = await user.getToken();
        console.log('[MagicBag Client] Trace Step 5: Acquired Clerk token for consumable/boost');
        const response = await fetch(apiUrl('/api/inventory/use'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            itemId,
            itemSlug: slug,
            problemId,
            clientQty: invItem.quantity,
            context: { selectedLang }
          })
        });

        console.log('[MagicBag Client] Trace Step 10: Received response status:', response.status);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('[MagicBag Client] Trace Step 10: Item use failed:', errData);
          showCombatText(errData.error || `FAILED TO USE ${itemName.toUpperCase()}`, 'enemy-hit');
          setUsingItemId(null);
          return;
        }

        const resData = await response.json();
        console.log('[MagicBag Client] Trace Step 10: Item use success:', resData);
        remainingAfter = resData.remainingQuantity ?? remainingAfter;
      }

      // Update local inventory count
      useItem(itemId, remainingAfter);

      // Apply gameplay buff mechanics (Bag stays open per UX spec)
      if (slug === 'focus_charm') {
        setAttempts(0);
        setActiveItems(prev => ({ ...prev, focus_charm: true }));
        showCombatText('🧿 ATTEMPTS RESET! ZERO PENALTY', 'player-hit');
      } else if (slug === 'healing_potion') {
        setPlayerHP(100);
        showCombatText('❤️ HP RESTORED TO 100%!', 'player-hit');
      } else if (slug === 'retry_shield') {
        setActiveItems(prev => ({ ...prev, retry_shield: true }));
        showCombatText('🛡️ RETRY SHIELD ACTIVE (BLOCKS NEXT HIT)!', 'player-hit');
      } else if (slug === 'lightning_flask') {
        setActiveItems(prev => ({ ...prev, lightning_flask: true }));
        showCombatText('🧪 2X COIN REWARD ON SOLVE!', 'player-hit');
      } else if (slug === 'shadow_veil') {
        setActiveItems(prev => ({ ...prev, shadow_veil: true }));
        showCombatText('🥷 SHADOW VEIL ACTIVE (-50% DMG / STEALTH)!', 'player-hit');
      } else if (slug === 'xp_tome') {
        activateBuff('xp_tome', 3600000);
        setActiveItems(prev => ({ ...prev, xp_tome: true }));
        showCombatText('📘 +50% XP BOOST ACTIVE (1 HOUR)!', 'player-hit');
      } else {
        setActiveItems(prev => ({ ...prev, [slug]: true }));
        showCombatText(`${itemName.toUpperCase()} ACTIVATED!`, 'player-hit');
      }

    } catch (err) {
      console.error('Error using item:', err);
      showCombatText('USAGE ERROR - ITEM PRESERVED', 'enemy-hit');
    } finally {
      setUsingItemId(null);
    }
  };

  // Screen shake effect
  const triggerScreenShake = () => {
    const arena = document.querySelector('.battle-arena');
    if (!arena) return;
    gsap.fromTo(arena, 
      { x: -5 }, 
      { x: 5, duration: 0.05, repeat: 5, yoyo: true, onComplete: () => gsap.set(arena, { x: 0 }) }
    );
  };

  const spawnDamageNumber = (amount, side) => {
    const id = Date.now();
    setFloatingDamage(prev => [...prev, { id, amount, side }]);
    setTimeout(() => {
      setFloatingDamage(prev => prev.filter(d => d.id !== id));
    }, 1500);
  };

  // Refs for WAAPI animations
  const enemyAvatarRef = useRef(null);
  const playerHpBarRef = useRef(null);
  const enemyHpBarRef = useRef(null);

  // Sync code when language or problem changes
  useEffect(() => {
    if (!problem) return;
    
    const savedCode = codesByLanguage[selectedLang];
    if (savedCode) {
      setCode(savedCode);
    } else {
      // Fallback to signature or legacy starterCode
      const initialCode = getStarterCode(problem, selectedLang);
      setCode(initialCode);
      setCodesByLanguage(prev => ({ ...prev, [selectedLang]: initialCode }));
    }
  }, [selectedLang, problemId]);

  const handleCodeChange = (newVal) => {
    setCode(newVal);
    setCodesByLanguage(prev => ({ ...prev, [selectedLang]: newVal }));
  };

  // Enemy idle float animation
  useEffect(() => {
    const el = enemyAvatarRef.current;
    if (!el) return;
    const anim = el.animate(
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-8px)' },
        { transform: 'translateY(0px)' },
      ],
      { duration: 3200, iterations: Infinity, easing: 'ease-in-out' }
    );
    return () => anim.cancel();
  }, []);

  // HP bar flash when hit
  const flashHpBar = (ref, color) => {
    if (!ref.current) return;
    ref.current.animate(
      [
        { opacity: 1 },
        { opacity: 0.3 },
        { opacity: 1 },
        { opacity: 0.3 },
        { opacity: 1 },
      ],
      { duration: 500, easing: 'ease-out' }
    );
  };

  const showCombatText = (text, type) => {
    setCombatText({ text, type, id: Date.now() });
    setTimeout(() => setCombatText(null), 1600);
  };

  if (!problem || !enemy) {
    return (
      <div className="page">
        <div className="container page-content">
          <p>Problem or Enemy not found.</p>
        </div>
      </div>
    );
  }

  const state = getState(problem.stateId);
  const region = getRegionById(problem.regionId);
  const alreadySolved = !!progress.solvedProblems[problemId];
  const diffClass = DIFFICULTY_LABELS[problem.difficulty] || 'medium';

  const playerHpPct = Math.max(0, (playerHP / 100) * 100);
  const enemyHpPct = Math.max(0, (enemyHP / enemy.baseHp) * 100);

  const handleRun = async () => {
    setIsRunning(true);
    setSubmitResult(null);
    setAttempts(a => a + 1);

    try {
      // runCode supports local JavaScript and backend execution for C++ and C
      const token = await user?.getToken?.();
      const results = await runCode(code, selectedLang, testCases, token, problemId);
      setRunResults(results);
      setPanelOpen(true);
      
      const passedCount = results.filter(r => r.passed).length;
      const allDryPassed = results.length > 0 && passedCount === results.length && !results.compileError && !results.runtimeError;
      if (allDryPassed) {
        showCombatText('DRY RUN — O.K.', 'player-hit');
      } else if (results.compileError) {
        showCombatText('COMPILE ERROR', 'enemy-hit');
      } else {
        showCombatText('RUN FAILED', 'enemy-hit');
      }

      // Ensure testcase panel is open and visible without scrolling the outer page
      setPanelOpen(true);

      const diag = diagnoseSubmissionForCodoGuide({
        code,
        language: selectedLang,
        results,
        passed: allDryPassed,
      });
      showCodoGuide(diag, { force: true, autoHideMs: allDryPassed ? 3500 : 0 });
    } catch (err) {
      console.error(err);
      showCombatText('ENGINE ERROR', 'enemy-hit');
      setRunResults([{ error: err.message, passed: false }]);
      const diag = diagnoseSubmissionForCodoGuide({
        code,
        language: selectedLang,
        results: [],
        passed: false,
        error: err.message,
      });
      showCodoGuide(diag, { force: true });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRunResults(null);
    setAiFeedback(null);
    setShowCompanion(false);

    try {
      let result = null;
      let token = null;

      if (user) {
        try {
          token = await user.getToken?.();
        } catch {
          // ignore token fetch error
        }
      }

      // 1. Submit to backend multi-language execution endpoint
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(apiUrl('/api/execute'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code,
            language: selectedLang,
            problemId,
            testCases: problem.testCases,
            mode: 'submit',
          }),
        });

        const parsed = await safeParseApiResponse(response);
        if (parsed.ok) {
          result = parsed.data;
        } else {
          result = {
            results: (problem.testCases || []).map((tc, idx) => ({
              caseNumber: idx + 1,
              input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
              expected: tc.expected,
              expectedOutput: tc.expected,
              actual: 'Compiler Unavailable',
              actualOutput: 'Compiler Unavailable',
              passed: false,
              status: 'service_error',
              error: parsed.serviceError,
            })),
            passed: false,
            serviceError: parsed.serviceError,
            compileError: null,
            runtimeError: null,
            feedback: parsed.serviceError,
            details: 'Execution could not be completed: ' + parsed.serviceError,
            complexity: { time: 'N/A', space: 'N/A' },
          };
        }
      } catch (fetchErr) {
        console.warn('API execute network failed:', fetchErr);
        // Only if JavaScript was selected do we allow local evaluation fallback
        if (selectedLang === 'javascript') {
          const localResults = await runCode(code, selectedLang, testCases, token, problemId);
          const allPassed = Array.isArray(localResults) && localResults.length > 0 && localResults.every(r => r.passed);
          result = {
            results: localResults,
            passed: allPassed,
            feedback: allPassed
              ? 'All test cases verified successfully!'
              : 'Check your logic and try again.',
            details: allPassed
              ? 'Verified 100% pass rate across all test cases.'
              : `${localResults.filter(r => r.passed).length} of ${localResults.length} test cases passed.`,
            complexity: { time: 'Evaluated', space: 'Evaluated' },
          };
        } else {
          const staticCheck = runStaticDiagnostics(code, selectedLang);
          const errMsg = 'Remote compiler unavailable: ' + (fetchErr.message || 'Network connection failed');
          result = {
            results: (problem.testCases || []).map((tc, idx) => ({
              caseNumber: idx + 1,
              input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
              expected: tc.expected,
              expectedOutput: tc.expected,
              actual: 'Compiler Unavailable',
              actualOutput: 'Compiler Unavailable',
              passed: false,
              status: 'service_error',
              error: errMsg,
            })),
            passed: false,
            serviceError: errMsg,
            compileError: null,
            runtimeError: null,
            feedback: staticCheck ? staticCheck.message : errMsg,
            details: staticCheck
              ? (staticCheck.nextStep || 'Fix the issue shown above and try again.')
              : 'Unable to connect to the backend compiler service. Verify connectivity.',
            complexity: { time: 'N/A', space: 'N/A' },
          };
        }
      }

      // If compilation error occurred in C++ or C, set clear feedback
      if (result.compileError) {
        result.passed = false;
        result.feedback = 'Compilation Error';
        result.details = result.compileError;
      }

      setSubmitResult({ 
        results: result.results || [], 
        allPassed: Boolean(result.passed),
        compileError: result.compileError || null,
        runtimeError: result.runtimeError || null,
        serviceError: result.serviceError || null,
      });
      setAiFeedback(result);
      setPanelOpen(true);

      // CODO GUIDE: Diagnose syntax/runtime/compiler errors locally without revealing DSA solutions
      const diag = diagnoseSubmissionForCodoGuide({
        code,
        language: selectedLang,
        results: result.results || [],
        passed: Boolean(result.passed),
        error: result.error || null,
      });
      showCodoGuide(diag, { force: true, autoHideMs: result.passed ? 4500 : 0 });

      // Damage Calculation
      const tcResults = result.results || [];
      const passedCount = tcResults.filter(tc => tc.passed).length;
      const totalCount = Math.max(tcResults.length, testCases.length, 1);
      const correctness = passedCount / totalCount;
      
      const playerBasePower = 50 * (progress?.level || 1);
      
      let damage = 0;
      if (correctness === 1) {
        damage = enemyHP; // instant kill, cap at remaining HP
      } else {
        damage = Math.floor(correctness * playerBasePower);
        damage = Math.min(enemyHP, damage);
      }
      damage = Math.max(0, damage);
      
      if (correctness === 1 && result.passed) {
        // Critical Strike / Full Success — Play authentic 3.5s crowd cheer sound
        playVictoryCrowdCheer();

        gsap.to({}, { duration: 0, onStart: triggerScreenShake });
        showCombatText('CRITICAL STRIKE!', 'player-hit');
        if (damage > 0) spawnDamageNumber(damage, 'enemy');
        setEnemyHP(prev => Math.max(0, prev - damage));
        flashHpBar(enemyHpBarRef, 'red');

        if (!alreadySolved) {
          markSolved(problemId, problem.stateId, problem.difficulty, Math.max(1, attempts), {
            problemTitle: problem.title,
            section: region?.name ? `${region.name} (${state?.name || 'World Map'})` : 'World Map Challenge',
            lightningFlaskActive: activeItems.lightning_flask,
            focusCharmActive: activeItems.focus_charm,
            xpBoostActive: isBuffActive('xp_tome') || activeItems.xp_tome,
          });

          if (activeItems.lightning_flask) {
            setTimeout(() => {
              showCombatText('⚡ 2X COINS CLAIMED!', 'player-hit');
            }, 800);
            setActiveItems(prev => ({ ...prev, lightning_flask: false }));
          }
          if (activeItems.focus_charm) {
            setActiveItems(prev => ({ ...prev, focus_charm: false }));
          }
        }
      } else if (correctness > 0) {
        // Partial Success (Some tests passed, but solution not fully accepted)
        showCombatText('HIT!', 'player-hit');
        if (damage > 0) spawnDamageNumber(damage, 'enemy');
        setEnemyHP(prev => Math.max(0, prev - damage));
        flashHpBar(enemyHpBarRef, 'orange');
        
        // Enemy counters & laughs at incomplete solution
        setTimeout(() => {
          triggerGoblinDefeatEffects({
            customScreenShake: triggerScreenShake,
            targetSelector: '.battle-arena'
          });
          let enemyDamage = Math.floor((1 - correctness) * (enemy.baseAttack || 20));
          if (activeItems.retry_shield) {
            enemyDamage = 0;
            showCombatText('🛡️ BLOCKED BY RETRY SHIELD!', 'player-hit');
            setActiveItems(prev => ({ ...prev, retry_shield: false }));
          } else if (activeItems.shadow_veil) {
            enemyDamage = Math.floor(enemyDamage * 0.5);
            showCombatText('🥷 SHADOW VEIL DAMPENED HIT (-50%)!', 'player-hit');
            setActiveItems(prev => ({ ...prev, shadow_veil: false }));
          }
          enemyDamage = Math.max(0, enemyDamage);
          if (enemyDamage > 0) {
            setPlayerHP(prev => Math.max(0, prev - enemyDamage));
            spawnDamageNumber(enemyDamage, 'player');
            flashHpBar(playerHpBarRef, 'green');
          }
        }, 1000);
      } else {
        // Failure: Screen shake + Goblin Evil Laugh (55% vol) + Device Vibration
        showCombatText('FAILED!', 'enemy-hit');
        triggerGoblinDefeatEffects({
          customScreenShake: triggerScreenShake,
          targetSelector: '.battle-arena'
        });
        let enemyDamage = Math.floor((1 - correctness) * (enemy.baseAttack || 20));
        if (activeItems.retry_shield) {
            enemyDamage = 0;
            showCombatText('🛡️ BLOCKED BY RETRY SHIELD!', 'player-hit');
            setActiveItems(prev => ({ ...prev, retry_shield: false }));
        } else if (activeItems.shadow_veil) {
            enemyDamage = Math.floor(enemyDamage * 0.5);
            showCombatText('🥷 SHADOW VEIL DAMPENED HIT (-50%)!', 'player-hit');
            setActiveItems(prev => ({ ...prev, shadow_veil: false }));
        }
        enemyDamage = Math.max(0, enemyDamage);
        if (enemyDamage > 0) {
          setPlayerHP(prev => Math.max(0, prev - enemyDamage));
          spawnDamageNumber(enemyDamage, 'player');
          flashHpBar(playerHpBarRef, 'green');
        }
      }

    } catch (err) {
      console.error(err);
      showCombatText('ERROR!', 'enemy-hit');
      triggerGoblinDefeatEffects({
        customScreenShake: triggerScreenShake,
        targetSelector: '.battle-arena'
      });
      const diag = diagnoseSubmissionForCodoGuide({
        code,
        language: selectedLang,
        results: [],
        passed: false,
        error: err.message,
      });
      showCodoGuide(diag, { force: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLangExtension = () => {
    switch (selectedLang) {
      case 'python': return [python()];
      case 'java': return [java()];
      case 'cpp': return [cppLanguageSupport()];
      case 'c': return [cLanguageSupport()];
      default: return [javascript()];
    }
  };

  const addCustomCase = () => {
    if (!customInput.trim()) return;
    
    let parsedInput;
    try {
      // Try to parse input if it looks like JSON (array or object)
      parsedInput = JSON.parse(customInput);
    } catch {
      // Fallback to raw string
      parsedInput = customInput;
    }

    setTestCases(prev => [
      ...prev, 
      { input: parsedInput, expected: customExpected || '?' }
    ]);
    setCustomInput('');
    setCustomExpected('');
    setShowAddCase(false);
  };

  const allSubmitPassed = submitResult?.allPassed;

  return (
    <div className="question-layout">

      {/* BATTLE ARENA — TOP */}
      <div className="battle-arena">
        <button className="brutalist-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> BACK
        </button>

        <div className="battle-ground">
          {/* Enemy Side */}
          <div className="battle-entity enemy-side">
            <div className="battle-hud enemy-hud">
              <div className="hud-header">
                <span className="hud-name">{enemy.name}</span>
                <span className="hud-level">Lv: 3</span>
              </div>
              <div className="hud-hp-row">
                <span className="hp-label">HP</span>
                <div className="hp-bar-wrap">
                  <div
                    ref={enemyHpBarRef}
                    className="hp-bar enemy-hp"
                    style={{ width: `${enemyHpPct}%`, backgroundColor: enemy.color || '#22C55E' }}
                  />
                </div>
              </div>
            </div>
            
            <div ref={enemyAvatarRef} className="battle-sprite-container enemy-sprite">
              <img src={(enemy.id === 'goblin' || enemy.id === 'phantom_goblin' || true) ? (enemyHP > 0 ? goblinNormalImg : goblinDamagedImg) : goblinNormalImg} alt={enemy.name} />
            </div>

            <AnimatePresence>
              {combatText && combatText.type === 'player-hit' && (
                <motion.div
                  key={combatText.id}
                  className="combat-float attack"
                  initial={{ opacity: 0, scale: 0.6, rotate: 10 }}
                  animate={{ opacity: 1, scale: 1.15, rotate: -6, y: -24 }}
                  exit={{ opacity: 0, scale: 0.8, y: -48 }}
                  transition={{ duration: 0.65, ease: 'backOut' }}
                >
                  {combatText.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player Side */}
          <div className="battle-entity player-side">
            <div className="battle-sprite-container player-sprite">
              <img src={playerHP > 20 ? charNormalImg : charDamagedImg} alt="Player" />
            </div>

            <div className="battle-hud player-hud">
              <div className="hud-header">
                <span className="hud-name">CODER</span>
                <span className="hud-level">Lv: {progress.level || 6}</span>
              </div>
              <div className="hud-hp-row">
                <span className="hp-label">HP</span>
                <div className="hp-bar-wrap">
                  <div
                    ref={playerHpBarRef}
                    className="hp-bar player-hp"
                    style={{ width: `${playerHpPct}%` }}
                  />
                </div>
              </div>
              <div className="hud-hp-text">{playerHP} / 100</div>
              <div className="hud-exp-row">
                <span className="exp-label">EXP</span>
                <div className="exp-bar-wrap"><div className="exp-bar" style={{width: '60%'}}></div></div>
              </div>
            </div>

            <AnimatePresence>
              {combatText && combatText.type === 'enemy-hit' && (
                <motion.div
                  key={combatText.id}
                  className="combat-float damage"
                  initial={{ opacity: 0, y: 0, scale: 0.7 }}
                  animate={{ opacity: 1, y: -40, scale: 1.1 }}
                  exit={{ opacity: 0, y: -70, scale: 0.9 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                  {combatText.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CODE SECTION — BOTTOM */}
      <div className="question-body v3-bottom">

        {/* Left: Description */}
        <div className="question-left">
          <div className="question-desc-scroll">
            <div className="mission-header">
              <span className="target-label">TARGET — {enemy.name.toUpperCase()}</span>
              <h2 className="mission-title">{problem.title.toUpperCase()}</h2>
              <span className={`badge badge-${diffClass}`}>{problem.difficulty.toUpperCase()}</span>
            </div>

            <div className="mission-body" style={{ marginTop: 8 }}>
              {problem.mission.split('\n').map((line, i) =>
                line.trim()
                  ? <p key={i} className="mission-line">{line.trim()}</p>
                  : <div key={i} style={{ height: 8 }} />
              )}
            </div>

            <hr className="divider" />

            <div className="desc-section">
              <span className="section-label">Examples</span>
              <div className="examples-list">
                {problem.testCases.map((tc, i) => (
                  <div key={i} className="example-block">
                    <div className="example-row">
                      <span className="example-label">Input</span>
                      <code className="example-value">{tc.input}</code>
                    </div>
                    <div className="example-row">
                      <span className="example-label">Output</span>
                      <code className="example-value">{tc.expected}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unlocked Hint Banner (from Hint Scroll) */}
            <AnimatePresence>
              {unlockedHint && (
                <motion.div
                  id="unlocked-hint-card"
                  className="unlocked-hint-banner neo-border"
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="unlocked-hint-header">
                    <div className="unlocked-hint-title-group">
                      <Lightbulb size={18} className="hint-bulb-icon" />
                      <span className="unlocked-hint-heading">HINT UNLOCKED</span>
                      <span className="hint-emoji">💡</span>
                    </div>
                    <button 
                      className="unlocked-hint-close-btn" 
                      onClick={() => setUnlockedHint(null)}
                      title="Hide Hint"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="unlocked-hint-body">
                    <p className="unlocked-hint-text">{unlockedHint}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {alreadySolved && (
              <motion.div
                className="explanation-section animate-fadeIn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="section-label" style={{ color: enemy.color }}>Codex Entry</span>
                <p className="explanation-text" style={{ marginTop: 8 }}>
                  <i>{enemy.lore}</i><br /><br />{problem.explanation}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Editor + Test Cases */}
        <div className="question-right">
          <div className="editor-container">
            {/* Editor Toolbar */}
            <div className="editor-toolbar">
              <div className="editor-toolbar-left">
                <span className="section-label">Code</span>
                <select
                  className="comic-select"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </div>
              <div className="editor-toolbar-right">
                <button
                  className={`btn-brutalist ${showInventory ? 'active' : ''}`}
                  onClick={() => setShowInventory(v => !v)}
                  title="Bag / Magic Items"
                >
                  <Backpack size={14} /> BAG
                  {inventory.length > 0 && (
                    <span className="bag-count-pill">{inventory.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  )}
                </button>
                <button
                  className="btn-brutalist"
                  onClick={handleRun}
                  disabled={isRunning || playerHP <= 0}
                >
                  <Play size={14} />
                  {isRunning ? 'RUNNING' : 'RUN'}
                </button>
                <button
                  className="btn-brutalist primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || playerHP <= 0}
                >
                  <Send size={14} />
                  {isSubmitting ? 'SUBMITTING' : 'SUBMIT'}
                </button>
              </div>
            </div>

            {/* Active Buffs Pill Bar */}
            {(activeItems.retry_shield || activeItems.lightning_flask || activeItems.focus_charm || activeItems.shadow_veil || isBuffActive('xp_tome')) && (
              <div className="active-buffs-bar">
                <span className="buff-bar-label">ACTIVE BUFFS:</span>
                {activeItems.retry_shield && (
                  <span className="buff-pill buff-shield">🛡️ Retry Shield (Negates Next Hit)</span>
                )}
                {activeItems.lightning_flask && (
                  <span className="buff-pill buff-coins">⚡ 2x Coins on Solve</span>
                )}
                {activeItems.focus_charm && (
                  <span className="buff-pill buff-focus">🧿 Zero Penalty</span>
                )}
                {activeItems.shadow_veil && (
                  <span className="buff-pill buff-stealth">🥷 Shadow Veil (-50% DMG)</span>
                )}
                {isBuffActive('xp_tome') && (
                  <span className="buff-pill buff-xp">📘 +50% XP Active</span>
                )}
              </div>
            )}

            {/* Code Editor */}
            <div className="editor-body">
              <CodeMirror
                value={code}
                onChange={handleCodeChange}
                extensions={getLangExtension()}
                theme={isDark ? oneDark : EditorView.theme({}, { dark: false })}
                height="100%"
                style={{ height: '100%' }}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: false,
                  autocompletion: true,
                  bracketMatching: true,
                }}
              />
            </div>
          </div>

          {/* Complete Test Cases & Error Output Panel */}
          <TestCasesPanel
            testCases={testCases}
            runResults={runResults}
            submitResult={submitResult}
            aiFeedback={aiFeedback}
            enemy={enemy}
            playerHP={playerHP}
            setPlayerHP={setPlayerHP}
            selectedLang={selectedLang}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            panelOpen={panelOpen}
            setPanelOpen={setPanelOpen}
            showAddCase={showAddCase}
            setShowAddCase={setShowAddCase}
            customInput={customInput}
            setCustomInput={setCustomInput}
            customExpected={customExpected}
            setCustomExpected={setCustomExpected}
            addCustomCase={addCustomCase}
            panelRef={panelRef}
          />

          {/* MAGIC BAG SLIDE-OVER OVERLAY (Non-intrusive over right workspace) */}
          <AnimatePresence>
            {showInventory && (
              <>
                <motion.div
                  className="magic-bag-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInventory(false)}
                />
                <motion.aside
                  className="magic-bag-slideover"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                  role="dialog"
                  aria-label="Magic Bag Inventory"
                >
                  <div className="magic-bag-header">
                    <div className="magic-bag-title-col">
                      <div className="magic-bag-title">
                        <Backpack size={18} />
                        <span>MAGIC BAG ({inventory.reduce((acc, i) => acc + i.quantity, 0)} ITEMS)</span>
                      </div>
                      <span className="magic-bag-subtitle">Tactical items & consumables</span>
                    </div>
                    <button 
                      className="magic-bag-close-btn" 
                      onClick={() => setShowInventory(false)}
                      title="Close Bag (Esc)"
                    >
                      ✕ CLOSE
                    </button>
                  </div>

                  {unlockedHint && (
                    <div className="magic-bag-unlocked-hint-box">
                      <div className="magic-bag-unlocked-hint-header">
                        <Lightbulb size={15} />
                        <span>ACTIVE DSA HINT</span>
                      </div>
                      <p className="magic-bag-unlocked-hint-text">{unlockedHint}</p>
                    </div>
                  )}

                  {inventory.length === 0 ? (
                    <div className="magic-bag-empty-wrap">
                      <div className="magic-bag-empty-icon">🎒</div>
                      <div className="magic-bag-empty-title">Your Bag is Empty!</div>
                      <p className="magic-bag-empty-desc">
                        Visit the Shop to acquire Hint Scrolls, Retry Shields, Focus Charms, and Lightning Flasks.
                      </p>
                      <button className="neo-btn inv-shop-btn" onClick={() => navigate('/shop')}>
                        VISIT SHOP
                      </button>
                    </div>
                  ) : (
                    <div className="magic-bag-list">
                      {inventory.map((invItem) => {
                        const slug = invItem.items?.slug || invItem.item_id || invItem.id;
                        const isUsing = usingItemId === (invItem.id || slug);
                        const isPassive = invItem.items?.type === 'passive' || invItem.items?.type === 'PASSIVE';
                        const isActiveBuff = (
                          (slug === 'retry_shield' && activeItems.retry_shield) ||
                          (slug === 'lightning_flask' && activeItems.lightning_flask) ||
                          (slug === 'focus_charm' && activeItems.focus_charm) ||
                          (slug === 'shadow_veil' && activeItems.shadow_veil) ||
                          (slug === 'xp_tome' && (activeItems.xp_tome || isBuffActive('xp_tome')))
                        );
                        const rarityKey = (invItem.items?.rarity || 'common').toLowerCase();
                        const rarityColor = RARITY_COLORS[rarityKey] || '#9CA3AF';

                        return (
                          <div key={invItem.id || slug} className="magic-bag-card">
                            <div className="magic-bag-card-icon-col" style={{ borderColor: rarityColor }}>
                              <span className="magic-bag-emoji">{invItem.items?.icon || invItem.items?.icon_url || '📦'}</span>
                              <span className="magic-bag-qty-tag">x{invItem.quantity}</span>
                            </div>
                            <div className="magic-bag-card-body">
                              <div className="magic-bag-card-top">
                                <span className="magic-bag-card-title">{invItem.items?.name || slug}</span>
                                <span 
                                  className="magic-bag-rarity-pill" 
                                  style={{ borderColor: rarityColor, color: rarityColor }}
                                >
                                  {rarityKey.toUpperCase()}
                                </span>
                              </div>
                              <p className="magic-bag-card-desc">{invItem.items?.description}</p>
                            </div>
                            <div className="magic-bag-card-action">
                              {isPassive ? (
                                <button className="magic-bag-btn-state passive" disabled title="Passive gear effect is permanently active">
                                  PASSIVE
                                </button>
                              ) : isActiveBuff ? (
                                <button className="magic-bag-btn-state active" disabled title="Already active for this battle">
                                  ACTIVE
                                </button>
                              ) : (
                                <button
                                  className="magic-bag-use-btn neo-btn"
                                  onClick={() => handleUseItem(invItem)}
                                  disabled={isUsing || invItem.quantity <= 0}
                                >
                                  {isUsing ? 'USING...' : 'USE'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* CODO GUIDE — SMART CODING COMPANION */}
      <AICompanion 
        isVisible={showCompanion} 
        feedback={companionGuide?.message}
        nextStep={companionGuide?.nextStep}
        severity={companionGuide?.severity || 'info'}
        onDismiss={() => setShowCompanion(false)}
      />

      {/* FLOATING DAMAGE NUMBERS */}
      <AnimatePresence>
        {floatingDamage.map(dmg => (
          <motion.div
            key={dmg.id}
            className={`floating-dmg ${dmg.side}`}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -100, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            -{dmg.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
