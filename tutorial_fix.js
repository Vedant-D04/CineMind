// Additional CSS for tutorial highlighted elements
const tutorialStyles = document.createElement('style');
tutorialStyles.textContent = `
    .tutorial-highlighted {
        position: relative !important;
        z-index: 1002 !important;
    }
`;
document.head.appendChild(tutorialStyles);

// Enhance showTutorialStep in existing script
const originalShowTutorialStep = window.showTutorialStep;
if (typeof showTutorialStep !== 'undefined') {
    window.showTutorialStep = function (stepIndex) {
        // Reset previous highlights
        document.querySelectorAll('.tutorial-highlighted').forEach(el => {
            el.classList.remove('tutorial-highlighted');
        });

        // Call original function
        if (originalShowTutorialStep) {
            originalShowTutorialStep(stepIndex);
        }

        // Add highlight to current target
        const step = tutorialSteps[stepIndex];
        if (step) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                targetElement.classList.add('tutorial-highlighted');
            }
        }
    };
}
