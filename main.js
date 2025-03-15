document.addEventListener('DOMContentLoaded', () => {
    const validPositions = [
        [0, 1],
        [1, 1], [1, 2],
        [2, 1], [2, 2], [2, 3],
        [3, 0], [3, 1], [3, 2], [3, 3]
    ];
    const initialConfig = [
        {row: 0, col: 1, type: 'white'},  // White knight at top left
        {row: 2, col: 2, type: 'white'},  // White knight in middle
        {row: 3, col: 0, type: 'black'},  // Black knight at bottom left
        {row: 3, col: 2, type: 'black'},  // Black knight at bottom right
    ];
    const targetConfig = [
        {row: 0, col: 1, type: 'black'},  // White knight at top left
        {row: 2, col: 2, type: 'black'},  // White knight in middle
        {row: 3, col: 0, type: 'white'},  // Black knight at bottom left
        {row: 3, col: 2, type: 'white'},  // Black knight at bottom right
    ];
    const gameState = {
        currentConfig: JSON.parse(JSON.stringify(initialConfig)),
        moveHistory: [],
        moves: 0,
        selectedCell: null,
    };
    
    const playBoard = document.getElementById('play-board');
    const targetBoard = document.getElementById('target-board');
    
    function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    function isValidPosition(row, col) {
        return validPositions.some(pos => pos[0] === row && pos[1] === col);
    }
    
    let draggedFromRow = null;
    let draggedFromCol = null;

    function handleDragStart(event) {
        const cell = event.target;
        draggedFromRow = parseInt(cell.parentElement.dataset.row);
        draggedFromCol = parseInt(cell.parentElement.dataset.col);
        
        gameState.selectedCell = {
            row: draggedFromRow,
            col: draggedFromCol,
            knight: gameState.currentConfig.find(k => k.row === draggedFromRow && k.col === draggedFromCol)
        };
        
        // Clear existing highlights
        const cells = playBoard.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected');
            c.classList.remove('valid-move');
        });
        
        // Highlight valid moves
        highlightValidMoves(draggedFromRow, draggedFromCol);
        
        // Set data transfer
        event.dataTransfer.setData('text/plain', cell.innerHTML);
        
        // Add a class to style the element while dragging
        cell.classList.add('dragging');
    }
    function handleDragOver(event) {
        // Prevent default to allow drop
        event.preventDefault();
    }
    function handleDrop(event) {
        event.preventDefault();
        
        // Get target cell
        const targetCell = event.target.classList.contains('cell') 
            ? event.target 
            : event.target.parentElement;
        
        // Get target position
        const targetRow = parseInt(targetCell.dataset.row);
        const targetCol = parseInt(targetCell.dataset.col);
        
        // Get dragged knight
        const draggedKnight = gameState.currentConfig.find(
            k => k.row === draggedFromRow && k.col === draggedFromCol
        );
        
        // Check if drop target is empty and a valid knight move
        const isTargetEmpty = !gameState.currentConfig.some(
            k => k.row === targetRow && k.col === targetCol
        );
        
        if (draggedKnight && isTargetEmpty && isValidKnightMove(draggedFromRow, draggedFromCol, targetRow, targetCol)) {
            // Move the knight
            moveKnight(draggedFromRow, draggedFromCol, targetRow, targetCol);
        }
        
        // Clear all highlights
        const cells = playBoard.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected');
            c.classList.remove('valid-move');
            c.classList.remove('dragging');
        });
        
        // Reset dragged position
        draggedFromRow = null;
        draggedFromCol = null;
        gameState.selectedCell = null;
    }
    function setupDragAndDrop() {
        const cells = playBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            // For the knight pieces (draggable elements)
            if (cell.innerHTML === '♞') {
                cell.setAttribute('draggable', 'true');
                cell.addEventListener('dragstart', handleDragStart);
            }
            
            // For all cells (drop targets)
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
        });
    }

    function createBoard(boardElement, config, isPlayable = false) {
        boardElement.innerHTML = '';
        
        // Create a 4x4 grid
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Check if this is a valid position in our restricted board
                if (!isValidPosition(row, col)) {
                    cell.classList.add('hidden');
                } else {
                    // Add data attributes for row and column
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    // Check if there's a knight at this position
                    const knight = config.find(k => k.row === row && k.col === col);
                    if (knight) {
                        // Create a span for the knight piece
                        const knightElement = document.createElement('span');
                        knightElement.innerHTML = '♞';
                        knightElement.classList.add(knight.type === 'white' ? 'knight-white' : 'knight-black');
                        
                        if (isPlayable) {
                            knightElement.setAttribute('draggable', 'true');
                            knightElement.addEventListener('dragstart', handleDragStart);
                        }
                        
                        cell.appendChild(knightElement);
                    }
                    
                    // Add click event for playable board
                    if (isPlayable) {
                        cell.addEventListener('click', handleCellClick);
                        cell.addEventListener('dragover', handleDragOver);
                        cell.addEventListener('drop', handleDrop);
                    }
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    function handleCellClick(event) {
        // Determine the actual cell (might have clicked on the knight span)
        const cell = event.target.classList.contains('cell') 
            ? event.target 
            : event.target.parentElement;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Clear all highlights first
        const cells = playBoard.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected');
            c.classList.remove('valid-move');
        });
        
        // If no cell is selected and this cell has a knight, select it
        if (gameState.selectedCell === null) {
            const knight = gameState.currentConfig.find(k => k.row === row && k.col === col);
            if (knight) {
                gameState.selectedCell = { row, col, knight };
                cell.classList.add('selected');
                
                // Highlight valid moves
                highlightValidMoves(row, col);
            }
        }
        else {
            const { row: fromRow, col: fromCol, knight } = gameState.selectedCell;
            
            const isTargetEmpty = !gameState.currentConfig.some(k => k.row === row && k.col === col);
            
            // Check if this is a valid knight move
            if (isTargetEmpty && isValidKnightMove(fromRow, fromCol, row, col)) {
                moveKnight(fromRow, fromCol, row, col);
                gameState.selectedCell = null;
            } else {
                // If clicking on another knight, switch selection
                const newKnight = gameState.currentConfig.find(k => k.row === row && k.col === col);
                if (newKnight) {
                    gameState.selectedCell = { row, col, knight: newKnight };
                    cell.classList.add('selected');
                    
                    // Highlight valid moves for the new knight
                    highlightValidMoves(row, col);
                } else {
                    // Deselect if clicking on an invalid move
                    gameState.selectedCell = null;
                }
            }
        }
    }
    
    function moveKnight(fromRow, fromCol, toRow, toCol) {
        if (gameState.gameOver) return;
        
        // Ensure this is a valid knight move
        if (!isValidKnightMove(fromRow, fromCol, toRow, toCol)) return;
        
        const knightIndex = gameState.currentConfig.findIndex(
            k => k.row === fromRow && k.col === fromCol
        );
        
        if (knightIndex !== -1) {
            gameState.moveHistory.push(JSON.parse(JSON.stringify(gameState.currentConfig)));
            
            gameState.currentConfig[knightIndex].row = toRow;
            gameState.currentConfig[knightIndex].col = toCol;
            
            gameState.moves++;
            document.getElementById('moves-count').textContent = gameState.moves;
            
            createBoard(playBoard, gameState.currentConfig, true);
            
            checkForWin();
        }
    }
    
    function checkForWin() {
        const sortedCurrent = [...gameState.currentConfig].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            if (a.col !== b.col) return a.col - b.col;
            return a.type === 'white' ? -1 : 1;
        });

        const sortedTarget = [...targetConfig].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            if (a.col !== b.col) return a.col - b.col;
            return a.type === 'white' ? -1 : 1;
        });

        const matches = sortedCurrent.every((knight, index) => {
            const targetKnight = sortedTarget[index];
            return knight.row === targetKnight.row && 
                knight.col === targetKnight.col && 
                knight.type === targetKnight.type;
        });

        if (matches) {
            gameState.gameOver = true;
            const moves = gameState.moves;
            const successMessage = document.getElementById('success-message');
            successMessage.textContent = `🎉 Congratulations! You solved the puzzle in ${moves} moves!`;
            successMessage.style.display = 'block';
        }
    }
    
    function highlightValidMoves(row, col) {
        const cells = playBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            const targetRow = parseInt(cell.dataset.row);
            const targetCol = parseInt(cell.dataset.col);
            
            const hasPiece = gameState.currentConfig.some(k => k.row === targetRow && k.col === targetCol);
            if (hasPiece) return;
            
            if (isValidKnightMove(row, col, targetRow, targetCol)) {
                cell.classList.add('valid-move');
            }
        });
    }

    document.getElementById('reset-btn').addEventListener('click', () => {
        gameState.currentConfig = JSON.parse(JSON.stringify(initialConfig));
        gameState.moveHistory = [];
        gameState.moves = 0;
        gameState.selectedCell = null;
        
        document.getElementById('moves-count').textContent = '0';
        document.getElementById('success-message').style.display = 'none';
        
        createBoard(playBoard, gameState.currentConfig, true);
    });
    document.getElementById('undo-btn').addEventListener('click', () => {
        if (gameState.moveHistory.length > 0) {
            gameState.currentConfig = gameState.moveHistory.pop();
            gameState.moves = Math.max(0, gameState.moves - 1);
            gameState.selectedCell = null;
            
            document.getElementById('moves-count').textContent = gameState.moves;
            document.getElementById('success-message').style.display = 'none';
            
            createBoard(playBoard, gameState.currentConfig, true);
        }
    });
    
    createBoard(playBoard, initialConfig, true);
    createBoard(targetBoard, targetConfig, false);
});
