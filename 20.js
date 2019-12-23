const Advent = new (require('./index.js'))(20, 2019);
const Screen = new (require('./screen'))({
    simulate: true,
    logWidth: 60,
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

        this.nbCache = {};
    }

    GetValidNeighbours(cell) {
        const cacheKey = `${cell.x},${cell.y}`;
        if (this.nbCache[cacheKey] !== undefined) return this.nbCache[cacheKey];
        const nd = Screen.GetNeighbours(cell).filter(x => x !== undefined && x.val === '.');
        if (cell.portal) {
            const PortalExits = this.portals[cell.portal];
            nd.push(...PortalExits.filter(x => x.x !== cell.x && x.y !== cell.y));
        }
        this.nbCache[cacheKey] = nd;
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
                    Screen.Set(x.x, x.y, x.val.toLowerCase());
                });

                const PortalCell = FindPortalActiveCell(BothPortalCells);

                // internal or external portal?
                const ExternalCell = PortalCell.x <= 2 || PortalCell.x >= (Screen.maxX - 2) || PortalCell.y <= 2 || PortalCell.y >= (Screen.maxY - 2);

                Screen.SetKey(PortalCell.x, PortalCell.y, 'portal', PortalID);
                Screen.SetKey(PortalCell.x, PortalCell.y, 'externalPortal', ExternalCell);
                if (PortalID === 'ZZ') {
                    Screen.SetKey(PortalCell.x, PortalCell.y, 'exit', true);
                    Screen.SetKey(PortalCell.x, PortalCell.y, 'style', '{red-fg}{red-bg}');
                } else {
                    Screen.SetKey(PortalCell.x, PortalCell.y, 'style', ExternalCell ? '{blue-bg}' : '{green-bg}');
                }

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

    PathFindP2(a, b) {
        const visitedCells = {};

        const todo = [{
            pos: a,
            dist: 0,
            depth: 0,
            path: [],
        }];
        let bestPath = null;
        const step = (c) => {
            // skip if bestPath is already shorter than this attempt
            if (bestPath !== null && c.dist > bestPath.dist) return;
            if (c.depth < 0) return;

            if (c.pos.x === b.x && c.pos.y === b.y && c.depth === 0) {
                if (bestPath === null || bestPath.dist > c.dist) {
                    bestPath = c;
                }
                return;
            }
            
            const visitKey = `${c.pos.x},${c.pos.y},${c.depth}`;
            if (visitedCells[visitKey] === undefined || visitedCells[visitKey] >= c.dist) {
                visitedCells[visitKey] = c.dist;
                const ns = this.GetValidNeighbours(c.pos).filter(x => x.val === '.');

                ns.forEach((cell) => {
                    const path = c.path.concat([]);

                    const changedDepth = cell.portal !== undefined && (Math.abs(c.pos.x - cell.x) + Math.abs(c.pos.y - cell.y) > 4);

                    let newDepth = c.depth;
                    if (changedDepth) {
                        path.push(c.pos.portal);
                        if (c.pos.externalPortal) {
                            newDepth--;
                            if (newDepth < 0) return;
                        } else{
                            newDepth++;
                        }
                    }

                    const nextItem = {
                        pos: cell,
                        dist: c.dist + 1,
                        depth: newDepth,
                        path,
                    };
                    if (todo.length > 0 && todo[0].depth > nextItem.depth) {
                        todo.unshift(nextItem);
                    } else {
                        todo.push(nextItem);
                    }
                });
            }
            
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
    const M = new Maze(input);
    const Start = M.FindPortalSpace('AA');
    const End = M.FindPortalSpace('ZZ');
    
    return M.PathFind(Start, End).then((res) => {
        return Advent.Submit(res.dist).then(() => {
            return M.PathFindP2(Start, End).then((res) => {
                return Advent.Submit(res.dist, 2);
            });
        });
    });
    
}).catch((e) => {
    console.log(e);
});