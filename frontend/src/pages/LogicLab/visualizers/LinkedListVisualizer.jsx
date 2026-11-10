import LinkedListSeeStage from './linkedlist/LinkedListSeeStage';
import LinkedListTouchStage from './linkedlist/LinkedListTouchStage';
import LinkedListExperimentStage from './linkedlist/LinkedListExperimentStage';
import './Visualizer.css';

export default function LinkedListVisualizer({ step = 0, readonly = false }) {
  if (readonly || step === 0) {
    return (
      <div className="visualizer">
        <LinkedListSeeStage />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="visualizer">
        <LinkedListTouchStage />
      </div>
    );
  }

  return (
    <div className="visualizer">
      <LinkedListExperimentStage />
    </div>
  );
}
