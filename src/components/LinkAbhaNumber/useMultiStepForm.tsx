import {
  Dispatch,
  ReactElement,
  SetStateAction,
  cloneElement,
  useCallback,
  useMemo,
  useState,
} from "react";

export interface InjectedStepProps<T> {
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goTo: (step: string) => void;
  memory: T | null;
  setMemory: Dispatch<SetStateAction<T>>;
}

export type MultiStepFormStep = {
  id: string;
  element: ReactElement;
};

export default function useMultiStepForm<T>(
  steps: MultiStepFormStep[],
  initialValues?: T
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [memory, setMemory] = useState<T>(initialValues as T);

  const goTo = useCallback(
    (stepId: string) => {
      const stepIndex = steps.findIndex((step) => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step with id ${stepId} not found`);
      }

      setCurrentStepIndex(stepIndex);
    },
    [steps.length]
  );

  const options = useMemo(
    () => ({
      currentStepIndex,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === steps.length - 1,
      goTo,
      memory,
      setMemory,
    }),
    [currentStepIndex, memory, goTo, steps.length]
  );

  const currentStep = cloneElement(steps[currentStepIndex].element, {
    ...options,
    ...(steps[currentStepIndex].element as ReactElement<T>).props,
  });

  return { currentStep, ...options };
}
