let trackedCircles = [];

function undoCircles(circlesArray) {
  circlesArray.forEach((currentElement) => {
    currentElement.innerHTML = "";
    currentElement.classList.remove("flex");
  });
}

const highlightCircle = function (attachSquares, clickedElement) {
  if (trackedCircles.length !== 0) {
    undoCircles(trackedCircles);
    trackedCircles = [];
  }

  attachSquares.forEach((square) => {
    if (square) {
      const circleElement = document.createElement("div");
      circleElement.classList.add("circle");
      square.appendChild(circleElement);
      square.classList.add("flex");
      trackedCircles.push(square);

      square.addEventListener("click", function () {
        square.innerHTML = clickedElement.innerHTML;
        clickedElement.innerHTML = "";
      });
    }
  });
};

const arrayOfPawn = [];

for (const i of filesNameArray) {
  const whitePawn = document.getElementById(i + 2);
  const blackPawn = document.getElementById(i + 7);
  if (whitePawn) arrayOfPawn.push(whitePawn);
  if (blackPawn) arrayOfPawn.push(blackPawn);
}

for (const i of arrayOfPawn) {
  i.addEventListener("click", () => {
    const currentId = i.getAttribute("id");
    const file = currentId[0];
    const rank = parseInt(currentId[1]);
    const stepsSquare = [];

    if (rank === 2) {
      const step1 = document.getElementById(file + (rank + 1));
      const step2 = document.getElementById(file + (rank + 2));
      if (step1) stepsSquare.push(step1);
      if (step2) stepsSquare.push(step2);
    } else if (rank === 7) {
      const step1 = document.getElementById(file + (rank - 1));
      const step2 = document.getElementById(file + (rank - 2));
      if (step1) stepsSquare.push(step1);
      if (step2) stepsSquare.push(step2);
    }

    highlightCircle(stepsSquare, i);
  });
}