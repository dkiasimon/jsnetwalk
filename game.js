/*
	Netwalk main game engine
	Copyright 2013 Simon Laburda <simon@dkia.at>
	
	Original source code from knetwalk (http://games.kde.org/game.php?game=knetwalk):
    Copyright 2004-2005 Andi Peredri <andi@ukr.net>
    Copyright 2007-2008 Fela Winkelmolen <fela.kde@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var None = 0;
var Up = 1;
var Left = 2;
var Right = 4;
var Down = 8;
var Inverted = 16;
var NO_CELL = -1;

var minCellRatio = 0.8;


function Cell(v_index) {
	return {
		originalCables: 0,
		cables: 0,
		server: false,
		connected: false,
		moved: false,
		index: v_index,
		
		isTerminal: function() {
			return (!this.server) && ((this.cables == Up) || (this.cables == Left) || (this.cables == Right) || (this.cables == Down));
		},
		
		isServer: function() {
			return this.server;
		},
		
		isConnected: function() {
			return this.connected;
		},
				
		setCables: function(directions) {
			this.originalCables = directions;
			this.cables = directions;
			this.moved = false;
		},
		
		setServer: function(isServer) {
			this.server = isServer;
		},
		
		setServer: function(isServer) {
			this.server = isServer;
		},
		
		setConnected: function(isConnected) {
			this.connected = isConnected;
		},
		
		makeEmpty: function() {
			this.cables = 0;
			this.server = false;
			this.connected = false;
			this.moved = false;
		},
		
		emptyMove: function() {
			this.moved = true;
		},
		
		rotateClockwise: function() {
			var n = 0;
			if(this.cables & Up) n = n | Right;
			if(this.cables & Right) n = n | Down;
			if(this.cables & Down) n = n | Left;
			if(this.cables & Left) n = n | Up;
			this.cables = n;
			this.moved = true;
		},	
		
		rotateCounterClockwise: function() {
			var n = 0;
			if(this.cables & Up) n = n | Left;
			if(this.cables & Right) n = n | Up;
			if(this.cables & Down) n = n | Right;
			if(this.cables & Left) n = n | Down;
			this.cables = n;
			this.moved = true;
		},
		
		invert: function() {
			this.rotateClockwise();
			this.rotateClockwise();
		},
		
		reset: function() {
			this.moved = false;
			this.cables = this.originalCables;
		},
		
		renderText: function() {
			return " " + (this.cables & Up ? (this.isConnected() ? "\"" : "I") : " ") + " \n"
			 + (this.cables & Left ? (this.isConnected() ? "=" : "-") : " ") + (this.isServer() ? "S" : (this.isTerminal() ? "P" : (this.cables == None ? " " : "+"))) + (this.cables & Right ? (this.isConnected() ? "=" : "-") : " ") + "\n" +
			 " " + (this.cables & Down ? (this.isConnected() ? "\"" : "I") : " ") + " ";
		},
		
		getGraphic: function() {
			var img = { rotate:0, graphic:false, overlay:false };
			switch(this.cables) {
				case                       Up : img = { rotate:0, graphic:"up" }; break;
				case               Right      : img = { rotate:90, graphic:"up" }; break;
				case               Right | Up : img = { rotate:0, graphic:"upright" }; break;
				case        Down              : img = { rotate:180, graphic:"up" }; break;
				case        Down         | Up : img = { rotate:0, graphic:"updown" }; break;
				case        Down | Right      : img = { rotate:90, graphic:"upright" }; break;
				case        Down | Right | Up : img = { rotate:90, graphic:"leftupright" }; break;
				case Left                     : img = { rotate:270, graphic:"up" }; break;
				case Left                | Up : img = { rotate:270, graphic:"upright" }; break;
				case Left        | Right      : img = { rotate:90, graphic: "updown" }; break;
				case Left        | Right | Up : img = { rotate:0, graphic: "leftupright" }; break;
				case Left | Down              : img = { rotate:180, graphic: "upright" }; break;
				case Left | Down         | Up : img = { rotate:270, graphic: "leftupright" }; break;
				case Left | Down | Right      : img = { rotate:180, graphic: "leftupright" }; break;
			}
			if(this.isServer()) {
				img.overlay = "server";
			} else if(this.isTerminal()) {
				img.overlay = this.isConnected() ? "terminal-connected" : "terminal";
			}
			if(img.graphic && this.isConnected()) {
				img.graphic += "-connected";
			}
			return img;
		},
		
	};
}

function Move(v_index, v_direction) {
	return {
		index: v_index,
		move: v_direction
	};
}

function Grid(w, h, isWrapped) {
	var grid = {
		width: w,
		height: h,
		wrapped: isWrapped,
		serverIndex: -1,
		cellCount: w*h,
		cells: [ ],
		
		createGrid: function() {
			// add a random server
			this.serverIndex = Math.floor(Math.random()*this.cellCount);
			
			// number of cells that aren't free
			var notFreeCells = 0;
			var minimumNumCells = this.cellCount * minCellRatio;
			
			// retries until the minimum number of cells is big enough
			while (notFreeCells < minimumNumCells) {

				for (var i = 0; i < this.cellCount; ++i) {
				    this.cells[i].makeEmpty();
				}
				this.cells[this.serverIndex].setServer(true);

				var list = [ this.serverIndex ];
				if (Math.random() > 0.5) list.push(this.addRandomCable(list));

				// add some random cables...
				// the list empties if there aren't many free cells left
				// (because of addRandomCable() not doing anything)
				while (list.length > 0) {
				    if (Math.random() > 0.5) {
				        this.addRandomCable(list);
				        if (Math.random() > 0.5) this.addRandomCable(list);
				    } else {
				        list.push(list[0]); 
				    }
			        list.splice(0,1);
				}

				// count not empty cells
				notFreeCells = 0;
				for (var i = 0; i < this.cellCount; ++i) {
				    if (this.cells[i].cables != 0) ++notFreeCells;
				}
			}
		},

		addRandomCable: function (list) {
			var cell = list[0];
			// find all the cells surrounding list.first()
			// (0 when cells don't exist)
			var ucell = this.uCell(cell); // up
			var rcell = this.rCell(cell); // right
			var dcell = this.dCell(cell); // down
			var lcell = this.lCell(cell); // left

			var freeCells = [  ];
			// of those cells map the ones that are free
			if (ucell != NO_CELL && this.cells[ucell].cables == None) {
				freeCells.push({dir: Up, cell: ucell});
			}
			if (rcell != NO_CELL && this.cells[rcell].cables == None) {
				freeCells.push({dir: Right, cell: rcell});
			}
			if (dcell != NO_CELL && this.cells[dcell].cables == None) {
				freeCells.push({dir: Down, cell: dcell});
			}
			if (lcell != NO_CELL && this.cells[lcell].cables == None) {
				freeCells.push({dir: Left, cell: lcell});
			}

			if (freeCells.length == 0) return; // no free cells left

			var cellArrId = Math.floor(Math.random()*(freeCells.length));
			var cellDir = freeCells[cellArrId].dir;
			var newCell = freeCells[cellArrId].cell;
			
			// add the cable in the direction of cell
			var newCables = this.cells[cell].cables | cellDir;
			this.cells[cell].setCables(newCables);
			// add a cable in the opposite direction, on the free cell
			this.cells[newCell].setCables(invertDirection(cellDir));
			// append the cell that was free to the list
			list.push(newCell);
		},
		
		uCell: function(cell) {
			if(cell >= this.width) {
				return cell - this.width;
			} else if(this.wrapped) {
				return this.width * (this.height - 1) + cell;
			} else {
				return NO_CELL;
			}
		},
			
		dCell: function(cell) {
			if(cell < (this.width * (this.height - 1))) {
				return cell + this.width;
			} else if(this.wrapped) {
				return cell - this.width * (this.height - 1);
			} else {
				return NO_CELL;
			}
		},
		
		lCell: function(cell) {
			if ((cell % this.width) > 0) {
				return cell - 1;
			} else if (this.wrapped) {
				return cell - 1 + this.width;
			} else {
				return NO_CELL;
			}
		},

		rCell: function(cell) {
			if ((cell % this.width) < (this.width - 1)) {
				return cell + 1;
			} else if (this.wrapped) {
				return cell + 1 - this.width;
			} else {
				return NO_CELL;
			}
		},
		
		solutionCount: function() {
			var possibleNextMoves = [ ];
			// TODO: put following in external function
			for(var cellid=0;cellid<this.cellCount;cellid++) {
				var cell = this.cells[cellid];
				
				if (!cell.moved) {
				    var dirs = cell.cables;
				    var move;
				    if (dirs == None) {
				        // no cables
				        move = new Move(cellid, None);
				        possibleNextMoves.push(move);
				    } else if (dirs == (Up | Down) || dirs == (Left | Right)) {
				        // cables forming a line
				        move = new Move(cellid, None);
				        possibleNextMoves.push(move);

				        move = new Move(cellid, Left);
				        possibleNextMoves.push(move);
				    } else {
				        // other kind of cables
				        move = new Move(cellid, None);
				        possibleNextMoves.push(move);

				        move = new Move(cellid, Left);
				        possibleNextMoves.push(move);

				        move = new Move(cellid, Right);
				        possibleNextMoves.push(move);

				        move = new Move(cellid, Inverted);
				        possibleNextMoves.push(move);
				    }
				    break;
				}
			}

			// all cells have been moved
			if (possibleNextMoves.length == 0) {
				return this.isPossibleSolution() ? 1 : 0;
			}
			// else

			var solutionsFound = 0;
			for(var nextMoveId=0;nextMoveId<possibleNextMoves.length;nextMoveId++) {
				var nextMove = possibleNextMoves[nextMoveId];
				var index = nextMove.index;

				switch (nextMove.move) {
					case None:
						this.cells[index].emptyMove();
						break;
					case Right:
						this.cells[index].rotateClockwise();
						break;
					case Left:
						this.cells[index].rotateCounterClockwise();
						break;
					case Inverted:
						this.cells[index].invert();
						break;
				}

				if (this.movesDoneArePossible()) {
				    solutionsFound += this.solutionCount(); // recursive call
				}

				this.cells[index].reset(); // undo move
			}
			return solutionsFound;

		},
		
		movesDoneArePossible: function() {
			for(var cellid=0;cellid<this.cells.length;cellid++) {
				var cell=this.cells[cellid];
				if (!cell.moved) continue;

				var x = cellid % this.width;
				var y = cellid / this.width;
				var cables = cell.cables;

				// check if there are moved cells near the borders that are wrong
				if (!this.wrapped) {
				    if (x == 0             && cables & Left)  return false;
				    if (x == this.width-1  && cables & Right) return false;
				    if (y == 0             && cables & Up)    return false;
				    if (y == this.height-1 && cables & Down)  return false;
				}

				// check if there are contiguous moved cells that are wrong

				if (cables & Left) {
				    var lcell = this.lCell(cellid);
				    if (lcell != NO_CELL && this.cells[lcell].moved) {
				        // also the cell to the left of the current has been moved

				        // if it doesn't connect return false
				        if (!(this.cells[lcell].cables & Right)) return false;
				    }
				}
				if (cables & Right) {
				    var rcell = this.rCell(cellid);
				    if (rcell != NO_CELL && this.cells[rcell].moved) {
				        if (!(this.cells[rcell].cables & Left)) return false;
				    }
				}
				if (cables & Up) {
				    var ucell = this.uCell(cellid);
				    if (ucell != NO_CELL && this.cells[ucell].moved) {
				        if (!(this.cells[ucell].cables & Down)) return false;
				    }
				}
				if (cables & Down) {
				    var dcell = this.dCell(cellid);
				    if (dcell != NO_CELL && this.cells[dcell].moved) {
				        if (!(this.cells[dcell].cables & Up)) return false;
				    }
				}				
			}
			
			// nothing was wrong
			return true;
		},
		
		hasUnneededCables: function() {
			for(var cellId=0;cellId<this.cells.length;cellId++) {
				var cell=this.cells[cellId];
				if (cell.isTerminal() || cell.isServer() || cell.cables == None) {
			    	continue;
				}

				var oldCables = cell.cables;
				cell.setCables(None);

				var solution = this.isPossibleSolution();
				cell.setCables(oldCables);

				if (solution) {
				    // it has a solution also when the cables of cell are removed
				    return true;
				}
			}

	    return false;
	   },
	   
	   isPossibleSolution: function() {
			for(var cellId=0;cellId<this.cells.length;cellId++) {
				var cell=this.cells[cellId];
        		cell.setConnected(false);
		    }
    		this.updateConnections();

    		return this.allTerminalsConnected();
    	},
    	
		allTerminalsConnected: function() {
			// return false if there is a terminal that isn't connected
			for(var cellId=0;cellId<this.cells.length;cellId++) {
				var cell=this.cells[cellId];
				if (cell.isTerminal() && !cell.isConnected()) {
				    return false;
				}
			}
			// all terminals are connected
			return true;
		},
		
		updateConnections: function() {
			var newConnections=[];
			for (var i = 0; i < this.cellCount; ++i) {
				newConnections[i] = false;
			}

			// indexes of the changed cells
			var changedCells = [];
			changedCells.push(this.serverIndex);
			newConnections[this.serverIndex] = true;

			while (changedCells.length > 0) {
				var cell_index = changedCells[0];
				var uindex = this.uCell(cell_index);
				var rindex = this.rCell(cell_index);
				var dindex = this.dCell(cell_index);
				var lindex = this.lCell(cell_index);

				var cell = this.cells[cell_index];
				var ucell = (uindex != NO_CELL) ? this.cells[uindex] : 0;
				var rcell = (rindex != NO_CELL) ? this.cells[rindex] : 0;
				var dcell = (dindex != NO_CELL) ? this.cells[dindex] : 0;
				var lcell = (lindex != NO_CELL) ? this.cells[lindex] : 0;

				if ((cell.cables & Up) && ucell !== 0 &&
				        (ucell.cables & Down) && !newConnections[uindex]) {
				    newConnections[uindex] = true;
				    changedCells.push(uindex);
				}
				if ((cell.cables & Right) && rcell !== 0 &&
				        (rcell.cables & Left) && !newConnections[rindex]) {
				    newConnections[rindex] = true;
				    changedCells.push(rindex);
				}
				if ((cell.cables & Down) && dcell !== 0 &&
				        (dcell.cables & Up) && !newConnections[dindex]) {
				    newConnections[dindex] = true;
				    changedCells.push(dindex);
				}
				if ((cell.cables & Left) && lcell !== 0 &&
				        (lcell.cables & Right) && !newConnections[lindex]) {
				    newConnections[lindex] = true;
				    changedCells.push(lindex);
				}
				changedCells.splice(0,1);
			}

			// changedCells is empty here
			for (var i = 0; i < this.cellCount; i++) {
				var cell = this.cells[i];
				if (cell.isConnected() != newConnections[i]) {
				    changedCells.push(i);
				    cell.setConnected(newConnections[i]);
				}
			}

			return changedCells;
		}
	};
	
	for (var index = 0; index < grid.cellCount; ++index) {
		grid.cells.push(new Cell(index));
	}
	grid.createGrid();

	while(grid.hasUnneededCables() || grid.solutionCount() != 1) {
		// the grid is invalid: create a new one
		grid.createGrid();
	}
	

	grid.minimumMoves = 0;
	var shuffleLimit = grid.cellCount * minCellRatio;
	var notShuffledCells = [];
	for (var i = 0; i < grid.cellCount; ++i) {
		notShuffledCells.push(i);
	}

	// select a random cell that is not yet shuffled
	// rotate such that initial and final states are not same
	// repeat above two steps until minimum moves equal to shuffle limit
	while(grid.minimumMoves < shuffleLimit) {
		// selecting a random index
		var index = Math.floor(Math.random() * notShuffledCells.length);
		var cellNo = notShuffledCells[index];
//		console.log("Have " + cellNo + " at " + index);
		// removing the selected index so that it must not be used again
		notShuffledCells.splice(index,1);
		var cell = grid.cells[cellNo];
		var dir = cell.cables;

		// excludes None(Empty cell)
		if (dir == None) {
			continue;
		}
		// if straight line rotate once
		// cant rotate twice(it will be back on its initial state)
		else if ((dir == (Up | Down)) || (dir == (Left | Right))) {
			grid.minimumMoves += 1;
			cell.rotateClockwise();
		}
		// for every other case rotate 1..3 times
		else {
			var rotation = Math.floor(Math.random() * 3) + 1; // 1..3
			// cant rotate twice when m_minimumMoves == shuffleLimit - 1
			if (this.minimumMoves == shuffleLimit - 1 && rotation == 2){
				rotation = (rand() % 2)? 1 : 3; // 1 or 3
			}
			grid.minimumMoves += (rotation == 3) ? 1 : rotation;
			while(rotation--) {
				cell.rotateClockwise();
			}
		}
	}
	grid.updateConnections();
	
	return grid;
}

function invertDirection(dir) {
	switch(dir) {
		case Up: return Down;
		case Right: return Left;
		case Down: return Up;
		case Left: return Right;
		default:
			return 0;
	}
}



