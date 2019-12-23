const Advent = new (require('./index.js'))(20, 2019);
const Screen = new (require('./screen'))({
    simulate: true,
});

class Maze {
    constructor(input) {
        Screen.AddStyle(/(#)/, '{red-fg}');
        
        input.forEach((row, y) => {
            row.split('').forEach((char, x) => {
                Screen.Set(x, y, char);
            });
        });

        this.portals = {};
        this.FindPortals();
    }

    GetValidNeighbours(cell) {
        const nd = Screen.GetNeighbours(cell).filter(x => x !== undefined && x.val === '.');
        if (cell.portal) {
            const PortalExits = this.portals[cell.portal];
            nd.push(...PortalExits.filter(x => x.x !== cell.x && x.y !== cell.y));
        }
        return nd;
    }

    FindPortals() {
        const PortalChars = new Array(26).fill(0).map((x, i) => String.fromCharCode(65 + i));

        const SortCellsUpperLeftmost = (a, b) => {
            if (a.x === b.x) {
                return a.y - b.y;
            }
            return a.x - b.x;
        };

        const FindPortalActiveCell = (cells) => {
            let returnCell;
            cells.find(cell => {
                return Screen.GetNeighbours(cell).filter(x => {
                    const PathCell = x !== undefined && x.val === '.';
                    if (!PathCell) return false;
                    returnCell = x;
                    return true;
                }).length === 1;
            });
            return returnCell;
        };

        Screen.ForEachCell((cell) => {
            if (PortalChars.indexOf(cell.val) >= 0) {
                // find rest of portal
                const ns = Screen.GetNeighbours(cell);
                const otherPortalCell = ns.find(x => x !== undefined && PortalChars.indexOf(x.val) >= 0);

                const BothPortalCells = [cell, otherPortalCell];
                BothPortalCells.sort(SortCellsUpperLeftmost);
                const PortalID = BothPortalCells.map(x => x.val).join('');
                // clear out portal cells
                BothPortalCells.forEach(x => {
                    Screen.Set(x.x, x.y, ' ');
                });

                const PortalCell = FindPortalActiveCell(BothPortalCells);
                Screen.SetKey(PortalCell.x, PortalCell.y, 'portal', PortalID);
                Screen.SetKey(PortalCell.x, PortalCell.y, 'style', '{blue-bg}');

                if (!this.portals[PortalID]) {
                    this.portals[PortalID] = [];
                }
                this.portals[PortalID].push(PortalCell);
            }
        });
    }

    PathFind(a, b) {
        const visitedCells = {};

        const todo = [{
            pos: a,
            dist: 0,
        }];
        let bestPath = null;
        const step = (c) => {
            if (c.pos.x === b.x && c.pos.y === b.y) {
                if (bestPath === null || bestPath.dist > c.dist) {
                    bestPath = c;
                }
                return;
            }

            this.GetValidNeighbours(c.pos).filter(x => x.val === '.').forEach((cell) => {
                const visitKey = `${cell.x},${cell.y}`;
                if (visitedCells[visitKey] === undefined || visitedCells[visitKey] > c.dist) {
                    visitedCells[visitKey] = c.dist;

                    todo.push({
                        pos: cell,
                        dist: c.dist + 1,
                    });
                }
            });
            
        };

        return Screen.RunTodoList(todo, step).then(() => {
            return Promise.resolve(bestPath);
        });
    }

    FindPortalSpace(portalID) {
        if (!this.portals[portalID]) return undefined;
        return this.portals[portalID][0];
    }
}

Advent.GetInput().then((input) => {
    input2 = `         A           
         A           
  #######.#########  
  #######.........#  
  #######.#######.#  
  #######.#######.#  
  #######.#######.#  
  #####  B    ###.#  
BC...##  C    ###.#  
  ##.##       ###.#  
  ##...DE  F  ###.#  
  #####    G  ###.#  
  #########.#####.#  
DE..#######...###.#  
  #.#########.###.#  
FG..#########.....#  
  ###########.#####  
             Z       
             Z      `.split(/\n/g); 
    const M = new Maze(input);
    return M.PathFind(M.FindPortalSpace('AA'), M.FindPortalSpace('ZZ')).then((res) => {
        return Advent.Submit(res.dist);
    });
}).catch((e) => {
    console.log(e);
});