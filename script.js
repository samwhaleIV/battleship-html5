var columnLabels = "ABCDEFGHIJ";

var pieceTypes = [
    getPiece("carrier",5),
    getPiece("battleship",4),
    getPiece("cruiser",3),
    getPiece("submarine",3),
    getPiece("destroyer",2)
];

function getPiece(name,size) {
    return {
        size: size,
        name: name
    }
}
function createBoard() {
    var table = document.createElement("div");
    table.classList.add("board");
    var lookup = new Array(11);
    for(var y = 0;y<11;y++) {
        var row = new Array(11);
        for(var x = 0;x<11;x++) {
            var cell = document.createElement("div");
            cell.classList.add("cell");
            if(x > 0 && y === 0) {
                cell.appendChild(
                    document.createTextNode(columnLabels.charAt(x-1))
                );
            } else if(y > 0 && x === 0) {
                cell.appendChild(
                    document.createTextNode(y)
                );
            }
            cell.setAttribute("x",x);
            cell.setAttribute("y",y);
            table.appendChild(cell);
            row[x] = cell;
        }
        lookup[y] = row;
    }
    return {
        element: table,
        lookup: lookup
    };
}
function getEventLocation(event) {
    return {
        x: Number(event.target.getAttribute("x")),
        y: Number(event.target.getAttribute("y"))
    };
}
function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}
var createMode = false;
function registerBoardEvents(board,hoverGridTarget,allowCreation,lookup) {
    board.addEventListener("contextmenu",stopEvent);
    board.addEventListener("mousemove",function(event){
        stopEvent(event);
        var location = getEventLocation(event);
        if(!location.x || !location.y) {
            if(allowCreation && createMode) {
                removePendingCreation(lookup);
            }
            hoverGridTarget.textContent = "";
        } else {
            if(allowCreation && createMode) {
                updatePendingCreation(location.x,location.y,lookup);
            } else {
                var text = columnLabels.charAt(location.x-1) + location.y;
                hoverGridTarget.textContent = text;
            }
        }
    });
    board.addEventListener("mouseleave",function(event){
        stopEvent(event);
        hoverGridTarget.textContent = "";
        if(allowCreation && createMode) {
            removePendingCreation(lookup);
        }
    });
    board.addEventListener("mousedown",function(event){
        stopEvent(event);
        var location = getEventLocation(event);
        if(!location.x || !location.y) {
            return;
        }
        switch(event.button) {
            case 0:
                if(allowCreation && createMode) {
                    trySavePendingCreation(lookup);
                } else {
                    if(event.target.classList.contains("shape")) {
                        event.target.classList.remove("miss");
                        event.target.classList.toggle("hit");
                    } else {
                        event.target.classList.toggle("miss");
                        event.target.classList.remove("hit");
                    }
                }
                break;
            case 2:
                if(allowCreation && createMode) {
                    creationRotated = !creationRotated;
                    updatePendingCreation(location.x,location.y,lookup);
                } else {
                    if(event.target.classList.contains("shape")) {
                        event.target.classList.remove("miss");
                        event.target.classList.toggle("hit");
                    } else {
                        event.target.classList.toggle("hit");
                        event.target.classList.remove("miss");
                    }
                }
                break;
        }
    });
}
var validCreation = false;
function updatePendingCreation(x,y,lookup) {
    removePendingCreation(lookup);
    if(creationPiece) {
        var source;
        var size = creationPiece.size;
        if(creationRotated) {
            source = y;
        } else {
            source = x;
        }
        var end = Math.min(11,source+size);
        if(source + size >= 11) {
            classFill = "shape-invalid";
            if(creationRotated) {
                for(var start = source;start<end;start++) {
                    lookup[start][x].classList.add("shape-invalid");
                }
            } else {
                for(var start = source;start<end;start++) {
                    lookup[y][start].classList.add("shape-invalid");
                }
            }
            validCreation = false;
            return;
        }
        var hasExistingShape = false;
        if(creationRotated) {
            for(var start = source;start<end;start++) {
                if(lookup[start][x].classList.contains("shape")) {
                    hasExistingShape = true;
                    break;
                }
            }
        } else {
            for(var start = source;start<end;start++) {
                if(lookup[y][start].classList.contains("shape")) {
                    hasExistingShape = true;
                    break;
                }
            } 
        }
        var fill = hasExistingShape ? "shape-invalid" : "shape-tmp";
        if(creationRotated) {
            for(var start = source;start<end;start++) {
                lookup[start][x].classList.add(fill);
            }
        } else {
            for(var start = source;start<end;start++) {
                lookup[y][start].classList.add(fill);
            } 
        }
        validCreation = !hasExistingShape;
    } else {
        validCreation = false;
    }
}
function removePendingCreation(lookup) {
    for(var y = 1;y<11;y++) {
        var row = lookup[y];
        for(var x = 1;x<11;x++) {
            var cell = row[x];
            cell.classList.remove("shape-tmp");
            cell.classList.remove("shape-invalid");
        }
    }
}
function trySavePendingCreation(lookup) {
    if(validCreation) {
        for(var y = 1;y<11;y++) {
            var row = lookup[y];
            for(var x = 1;x<11;x++) {
                var cell = row[x];
                if(cell.classList.contains("shape-tmp")) {
                    cell.classList.remove("shape-tmp");
                    cell.classList.add("shape");
                }
            }
        }
        advanceCreation();
    }
}
var creationRotated = false;
var creationIndex = 0;
var creationPiece = null;
function advanceCreation() {
    if(creationIndex >= pieceTypes.length) {
        togglePlacingMode();
        return;
    }
    creationPiece = pieceTypes[creationIndex];
    instructionLabel.textContent = "Place your " + creationPiece.name + "...";
    creationIndex++;
}
function togglePlacingMode() {
    controlsPanel.classList.toggle("hidden");
    board2.element.classList.toggle("hidden");
    instructionLabel.classList.toggle("hidden");
    if(!createMode) {
        clearBoard(board1);
        creationIndex = 0;
        advanceCreation();
    }
    createMode = !createMode;
}
function clearBoard(board) {
    var children = board.element.children;
    for(var y = 1;y<11;y++) {
        for(var x = 1;x<11;x++) {
            var index = y * 11 + x;
            var child = children[index];
            child.classList.remove("miss");
            child.classList.remove("hit");
            child.classList.remove("shape");
        }
    }
}
var board1 = createBoard();
var board2 = createBoard();

var controlsPanel = document.getElementById("controls-panel");
var instructionLabel = document.getElementById("instruction-label");

registerBoardEvents(board1.element,board1.element.children[0],true,board1.lookup);
registerBoardEvents(board2.element,board2.element.children[0],false,board2.lookup);

var boardContainer = document.getElementsByClassName("board-container")[0];
boardContainer.appendChild(board1.element);
boardContainer.appendChild(board2.element);
