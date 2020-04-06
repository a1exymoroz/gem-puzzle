class GemPuzzle {
  constructor(rootNode) {
    this.rootNode = rootNode;
    // TODO: default 4
    this.boxSize = 3;
    this.matrixOfGamingValues = [];
    this.indexOfEmptyBlock = null;
    this.clickableBlocks = {
      active: null,
      items: [],
    };
    this.wrapperNode = null;
    this.mainNode = null;
    this.moveNode = null;
    this.timerNode = null;

    this.time = 0;
    this.timerInterval = null;
    this.moves = 0;

    this.winCombination = null;

    const results = JSON.parse(localStorage.getItem('results'));
    this.results = results || {};

    this.firstOpen = true;

    this.initLayout();
  }

  initLayout() {
    this.wrapperNode = document.createElement('div');
    this.wrapperNode.classList.add('puzzle__wrapper');
    this.rootNode.append(this.wrapperNode);
    this.buildHeader();
    this.mainNode = document.createElement('main');
    this.wrapperNode.append(this.mainNode);

    // TODO: delete start game
    this.buildFirstPage();
    // this.startGame();
  }

  buildFirstPage() {
    const firsPageNode = document.createElement('p');
    firsPageNode.textContent = 'Please click on "Shuffle and start"';
    this.mainNode.append(firsPageNode);
  }

  startGame() {
    this.mainNode.innerHTML = '';
    this.shuffleArray();
    this.findClickableBlocks();
    this.buildMain();
    this.fillPuzzleBlocks();
    this.buildFooter();
  }

  changeBoxSize() {
    this.clearPuzzleScores();
    this.mainNode.innerHTML = '';
    this.shuffleArray();
    this.findClickableBlocks();
    this.buildMain();
    this.fillPuzzleBlocks();
  }

  clearPuzzleScores() {
    this.time = 0;
    clearInterval(this.timerInterval);
    this.moves = 0;
    this.clickableBlocks.items = [];
  }

  /**
   * Build game header
   */
  buildHeader() {
    const header = document.createElement('header');
    header.classList.add('puzzle__header');

    // Navigation
    const buttonShuffleAndStart = document.createElement('button');
    buttonShuffleAndStart.classList.add('puzzle__button');
    buttonShuffleAndStart.textContent = 'Shuffle and start';
    header.append(buttonShuffleAndStart);

    const buttonStope = document.createElement('button');
    buttonStope.classList.add('puzzle__button');
    buttonStope.textContent = 'Stop';
    header.append(buttonStope);

    const buttonSave = document.createElement('button');
    buttonSave.classList.add('puzzle__button');
    buttonSave.textContent = 'Save';
    header.append(buttonSave);

    const buttonResults = document.createElement('button');
    buttonResults.classList.add('puzzle__button');
    buttonResults.textContent = 'Results';
    header.append(buttonResults);
    this.wrapperNode.append(header);

    const setDisableButtons = (buttons, isDisabled) => {
      buttons.forEach((element) => {
        element.disabled = isDisabled;
      });
    };

    setDisableButtons([buttonStope, buttonSave], true);

    buttonShuffleAndStart.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.firstOpen) {
        this.startGame();
        this.firstOpen = false;
      } else {
        this.changeBoxSize();
      }
      setDisableButtons([buttonStope], false);
      setDisableButtons([buttonShuffleAndStart, buttonResults, buttonSave], true);
      buttonStope.textContent = 'Stop';
    });

    buttonStope.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.timerInterval) {
        buttonStope.textContent = 'Resume';
        clearInterval(this.timerInterval);
        this.timerInterval = null;

        setDisableButtons([buttonShuffleAndStart, buttonResults, buttonSave], false);
      } else {
        buttonStope.textContent = 'Stop';
        this.startTimer();
        setDisableButtons([buttonShuffleAndStart, buttonResults, buttonSave], true);
      }
    });
    buttonSave.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openModal(false);
    });

    buttonResults.addEventListener('click', (event) => {
      event.stopPropagation();
      this.openResults();
    });
  }

  /**
   * Build main block
   */
  buildMain() {
    // Move and times
    const moveAndTime = document.createElement('div');
    moveAndTime.classList.add('puzzle__move-time');
    this.moveNode = document.createElement('div');
    this.moveNode.textContent = `Moves: ${this.moves}`;
    moveAndTime.append(this.moveNode);

    this.timerNode = document.createElement('div');
    this.timerNode.textContent = 'Time: 00:00';
    this.startTimer();
    moveAndTime.append(this.timerNode);

    this.mainNode.append(moveAndTime);

    // Block puzzles
    this.puzzleNode = document.createElement('div');
    this.puzzleNode.classList.add('puzzle__main');
    this.puzzleNode.style.gridTemplateColumns = `repeat(${this.boxSize}, 10vw)`;
    this.puzzleNode.style.gridTemplateRows = `repeat(${this.boxSize}, 10vh)`;
    const size = this.boxSize ** 2;

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < size; index += 1) {
      const element = document.createElement('div');
      element.classList.add('puzzle__item');
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        this.onClickPuzzleBlock(event.currentTarget);
      });
      fragment.append(element);
    }

    this.puzzleNode.append(fragment);

    this.mainNode.append(this.puzzleNode);
  }

  plusMove() {
    this.moves += 1;
    this.moveNode.textContent = `Moves: ${this.moves}`;
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.time += 1;
      this.timerNode.textContent = `Time: ${this.getTime()}`;
    }, 1000);
  }

  getTime(time = this.time) {
    let minutes = Math.floor(time / 60);
    minutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    let seconds = time % 60;
    seconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${seconds}`;
  }

  /**
   * Build footer block
   */
  buildFooter() {
    const footer = document.createElement('footer');
    footer.classList.add('puzzle__footer');

    const fieldSize = document.createElement('div');
    fieldSize.classList.add('puzzle__field-size');
    fieldSize.textContent = `Field size: ${this.boxSize}x${this.boxSize}`;
    footer.append(fieldSize);

    const otherSize = document.createElement('div');
    fieldSize.classList.add('puzzle__other-size');

    const otherSizeString = document.createElement('span');
    otherSizeString.textContent = 'Other size: ';
    otherSize.append(otherSizeString);

    const fragment = document.createDocumentFragment();
    for (let index = 3; index < 9; index += 1) {
      const button = document.createElement('button');
      button.classList.add('puzzle__button');
      button.addEventListener('click', (event) => {
        // Change box size and rebuild puzzle block
        event.stopPropagation();
        this.boxSize = index;
        fieldSize.textContent = `Field size: ${this.boxSize}x${this.boxSize}`;
        this.changeBoxSize();
      });
      button.textContent = `${index}x${index}`;
      fragment.append(button);
    }
    otherSize.append(fragment);

    footer.append(otherSize);

    this.wrapperNode.append(footer);
  }

  fillPuzzleBlocks() {
    const puzzleBlocks = this.puzzleNode.querySelectorAll('.puzzle__item');
    let indexPuzzleBlocks = 0;
    for (let matrixIndex = 0; matrixIndex < this.matrixOfGamingValues.length; matrixIndex += 1) {
      for (
        let arrayIndex = 0;
        arrayIndex < this.matrixOfGamingValues[matrixIndex].length;
        arrayIndex += 1
      ) {
        const value = this.matrixOfGamingValues[matrixIndex][arrayIndex];
        puzzleBlocks[indexPuzzleBlocks].dataset.matrixIndex = `${matrixIndex}`;
        puzzleBlocks[indexPuzzleBlocks].dataset.arrayIndex = `${arrayIndex}`;
        puzzleBlocks[indexPuzzleBlocks].dataset.value = `${value}`;
        puzzleBlocks[indexPuzzleBlocks].textContent = value;

        indexPuzzleBlocks += 1;
      }
    }
  }

  onClickPuzzleBlock(target) {
    const value = +target.dataset.value;
    if (this.clickableBlocks.items.includes(value)) {
      this.clickableBlocks.active = {
        matrix: +target.dataset.matrixIndex,
        array: +target.dataset.arrayIndex,
      };
      this.moveEmptyBlock();
    }
  }

  shuffleArray() {
    const size = this.boxSize ** 2;
    let array = [];
    for (let index = 0; index < size; index += 1) {
      array.push(index);
    }

    // Set Win combination
    this.winCombination = [...array];
    const firstValue = this.winCombination.shift();
    this.winCombination.push(firstValue);

    // for (let i = array.length - 1; i > 0; i -= 1) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [array[i], array[j]] = [array[j], array[i]];
    // }
    array = [1, 2, 3, 4, 5, 0, 7, 8, 6];
    const matrix = [];
    while (array.length) {
      matrix.push(array.splice(0, this.boxSize));
    }
    this.matrixOfGamingValues = matrix;
  }

  findClickableBlocks() {
    this.indexOfEmptyBlock = this.matrixOfGamingValues.reduce(
      (acu, cur, matrixIndex) => {
        cur.forEach((element, arrayIndex) => {
          if (element === 0) {
            acu.matrix = matrixIndex;
            acu.array = arrayIndex;
          }
        });
        return acu;
      },
      {
        matrix: null,
        array: null,
      },
    );

    const directions = ['up', 'right', 'down', 'left'];
    directions.forEach((element) => {
      this.getClickableBlock(
        element,
        this.indexOfEmptyBlock.matrix,
        this.indexOfEmptyBlock.array,
        this.matrixOfGamingValues,
      );
    });
  }

  getClickableBlock(direction, matrixIndex, arrayIndex, matrix) {
    switch (direction) {
      case 'up': {
        if (matrixIndex === 0) {
          return null;
        }
        this.clickableBlocks.items.push(matrix[matrixIndex - 1][arrayIndex]);
        break;
      }
      case 'right': {
        if (arrayIndex === matrix[matrixIndex].length - 1) {
          return null;
        }
        this.clickableBlocks.items.push(matrix[matrixIndex][arrayIndex + 1]);
        break;
      }
      case 'down': {
        if (matrixIndex === matrix.length - 1) {
          return null;
        }
        this.clickableBlocks.items.push(matrix[matrixIndex + 1][arrayIndex]);
        break;
      }
      case 'left': {
        if (arrayIndex === 0) {
          return null;
        }
        this.clickableBlocks.items.push(matrix[matrixIndex][arrayIndex - 1]);
        break;
      }
      default:
        break;
    }
    return true;
  }

  moveEmptyBlock() {
    this.matrixOfGamingValues[this.indexOfEmptyBlock.matrix][
      this.indexOfEmptyBlock.array
    ] = this.matrixOfGamingValues[this.clickableBlocks.active.matrix][
      this.clickableBlocks.active.array
    ];
    this.matrixOfGamingValues[this.clickableBlocks.active.matrix][
      this.clickableBlocks.active.array
    ] = 0;
    this.findClickableBlocks();
    this.fillPuzzleBlocks();
    this.plusMove();
    this.checkWinCombination();
  }

  checkWinCombination() {
    const gamingValues = this.matrixOfGamingValues.flat();
    for (let index = 0; index < this.winCombination.length; index += 1) {
      if (this.winCombination[index] !== gamingValues[index]) {
        return false;
      }
    }
    this.openModal(true);
    clearInterval(this.timerInterval);

    return true;
  }

  openModal(isWin) {
    document.body.classList.add('body-modal');

    const modalOpacity = document.createElement('div');
    modalOpacity.classList.add('puzzle__modal-opacity');
    document.body.append(modalOpacity);

    const modal = document.createElement('div');
    modal.classList.add('puzzle__modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('puzzle__modal-content');

    const header = document.createElement('h2');
    header.textContent = isWin
      ? 'Congratulations! You solved the puzzle!'
      : 'Do you want to save progress?';
    modalContent.append(header);

    const move = document.createElement('p');
    move.classList.add('puzzle__modal-paragraph');
    move.innerHTML = `Moves: <b>${this.moves}</b>`;
    modalContent.append(move);

    const time = document.createElement('p');
    time.classList.add('puzzle__modal-paragraph');
    time.innerHTML = `Time: <b>${this.getTime()}</b>`;
    modalContent.append(time);

    const form = document.createElement('form');
    const input = document.createElement('div');
    input.classList.add('puzzle__modal_flex');
    const labelName = document.createElement('label');
    labelName.for = 'name';
    labelName.textContent = 'Username: ';
    labelName.style.marginRight = '10px';
    input.append(labelName);
    const inputName = document.createElement('input');
    inputName.id = 'name';
    inputName.type = 'text';
    inputName.name = 'username';
    inputName.required = true;
    input.append(inputName);
    form.append(input);

    const formButtons = document.createElement('div');
    formButtons.classList.add('puzzle__modal_flex');
    const saveButton = document.createElement('button');
    saveButton.type = 'Submit';
    saveButton.textContent = 'Save';
    formButtons.append(saveButton);
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    formButtons.append(closeButton);
    form.append(formButtons);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.setResult(inputName.value, isWin);
      document.body.classList.remove('body-modal');
      modal.remove();
      modalOpacity.remove();
      this.openResults();
    });

    closeButton.addEventListener('click', () => {
      document.body.classList.remove('body-modal');
      modal.remove();
      modalOpacity.remove();
    });

    modalContent.append(form);
    modal.append(modalContent);
    document.body.append(modal);
  }

  setResult(name, isWin) {
    const result = {
      name,
      isWin,
      moves: this.moves,
      time: this.time,
    };
    if (this.results[`${this.boxSize}x${this.boxSize}`]) {
      this.results[`${this.boxSize}x${this.boxSize}`].push(result);
      this.results[`${this.boxSize}x${this.boxSize}`].sort((a, b) => a.time - b.time);
    } else {
      this.results[`${this.boxSize}x${this.boxSize}`] = [result];
    }
    localStorage.setItem('results', JSON.stringify(this.results));
  }

  openResults() {
    document.body.classList.add('body-modal');

    const modalOpacity = document.createElement('div');
    modalOpacity.classList.add('puzzle__modal-opacity');
    document.body.append(modalOpacity);

    const modal = document.createElement('div');
    modal.classList.add('puzzle__modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('puzzle__modal-content');

    const header = document.createElement('h2');
    header.textContent = 'Results';
    modalContent.append(header);

    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('puzzle__modal-table');
    const buildTable = (size) => {
      tableWrapper.innerHTML = '';
      const array = this.results[`${size}x${size}`].slice(0, 10);
      if (array && array.length) {
        const table = document.createElement('table');
        table.border = '1';
        const tr = document.createElement('tr');
        table.append(tr);
        ['Name', 'Moves', 'Time', 'Win'].forEach((element) => {
          const th = document.createElement('th');
          th.textContent = element;
          th.classList.add('modal__table-items');
          tr.append(th);
        });

        array.forEach((item) => {
          const resultTr = document.createElement('tr');
          const name = document.createElement('td');
          name.classList.add('modal__table-items');
          name.textContent = item.name;
          resultTr.append(name);

          const moves = document.createElement('td');
          moves.classList.add('modal__table-items');
          moves.textContent = item.moves;
          resultTr.append(moves);

          const time = document.createElement('td');
          time.classList.add('modal__table-items');
          time.textContent = this.getTime(item.time);
          resultTr.append(time);

          const win = document.createElement('td');
          win.classList.add('modal__table-items');
          win.textContent = item.isWin ? 'Yes' : 'No';
          resultTr.append(win);
          table.append(resultTr);
        });
        tableWrapper.append(table);
      } else {
        tableWrapper.innerHTML = 'No results';
      }
    };
    const initSize = 3;
    const sizeBlock = document.createElement('div');
    sizeBlock.classList.add('puzzle__modal_flex');
    for (let index = initSize; index < 9; index += 1) {
      const button = document.createElement('button');
      button.classList.add('puzzle__button');
      button.addEventListener('click', (event) => {
        // Change box size and rebuild tables
        event.stopPropagation();
        buildTable(index);
      });
      button.textContent = `${index}x${index}`;
      sizeBlock.append(button);
    }
    modalContent.append(sizeBlock);

    buildTable(initSize);
    modalContent.append(tableWrapper);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      document.body.classList.remove('body-modal');
      modal.remove();
      modalOpacity.remove();
    });

    modalContent.append(closeButton);
    modal.append(modalContent);
    document.body.append(modal);
  }
}

const rootNode = document.querySelector('#App');
new GemPuzzle(rootNode);
