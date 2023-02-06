let memoryLib = require('memoryLib');
let spawnLib = require('spawnLib');

module.exports.loop = function() {
    memoryLib.run();
    spawnLib.run();

    // find and run all creeps
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        switch (creep.memory.role) {
            case 'harvester':
                harvester(creep);
                break;
            case 'upgrader':
                upgrader(creep);
                break;
            case 'builder':
                builder(creep);
                break;
            case 'hauler':
                hauler(creep);
                break;
            case 'repairer':
                repairer(creep);
            break;
        }
    }

    // find and run towers
    for (let name in Game.structures) {
        let structure = Game.structures[name];

        if (structure.structureType == STRUCTURE_TOWER) {
            tower(structure);
        }
    }
}

function repairer(creep) {
    if (creep.store.getFreeCapacity() == 0) {
        creep.memory.repairing = true;
    } else if (creep.store[RESOURCE_ENERGY] == 0) {
        creep.memory.repairing = false;
    }

    if (creep.memory.repairing) {
        let closestDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (
                (structure.structureType == STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.01) ||
                (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.9)
            )
        });
        
        if (closestDamagedStructure) {
            //console.log('Repairing: ' + closestDamagedStructure.structureType + ' ' + closestDamagedStructure.hits + '/' + closestDamagedStructure.hitsMax)
            let repairTarget = creep.pos.findClosestByRange(closestDamagedStructure);
            if (creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
                creep.moveTo(repairTarget, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            if (target) {
                //console.log('Hauling to: ' + target.structureType + ' ' + target.store.getFreeCapacity(RESOURCE_ENERGY) + '/' + target.store.getCapacity(RESOURCE_ENERGY));
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    } else {
        let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        let containerEnergy = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        
        let closestEnergy;
        if (droppedEnergy) {
            if (containerEnergy) {
                if (creep.pos.getRangeTo(droppedEnergy) < creep.pos.getRangeTo(containerEnergy)) {
                    closestEnergy = droppedEnergy;
                } else {
                    closestEnergy = containerEnergy;
                }
            } else {
                closestEnergy = droppedEnergy;
            }
        } else {
            closestEnergy = containerEnergy;
        }
        
        if (closestEnergy) {
            if (closestEnergy.structureType == STRUCTURE_CONTAINER) {
                if (creep.withdraw(closestEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if (creep.pickup(closestEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
}

function tower(tower) {
    let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => (
            (structure.structureType == STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.01) ||
            (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.9)
        )
    });
    let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    if (closestHostile) {
        tower.attack(closestHostile);
    }

    if (closestDamagedStructure) {
        tower.repair(closestDamagedStructure);
    }
}

function harvester(creep) {
    if (creep.store.getFreeCapacity() > 0) {
        if (creep.harvest(Game.getObjectById(creep.memory.sourceId)) == ERR_NOT_IN_RANGE) {
            creep.moveTo(Game.getObjectById(creep.memory.sourceId), {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    } else {
        // if (creep.transfer(Game.spawns[creep.memory.spawnName], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //     creep.moveTo(Game.spawns[creep.memory.spawnName], {visualizePathStyle: {stroke: '#ffffff'}});   
        // }

        let containers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (containers.length > 0) {
            creep.transfer(containers[0], RESOURCE_ENERGY);
        } else {
            creep.drop(RESOURCE_ENERGY);
        }
    }
}

function upgrader(creep) {
    // if creep has no energy, go fill up
    if (creep.store[RESOURCE_ENERGY] == 0) {
        creep.memory.upgrading = false;
    
    } else if (creep.store.getFreeCapacity() == 0) {
        creep.memory.upgrading = true;
    }

    if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } else {
        let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        let containerEnergy = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        
        let closestEnergy;
        if (droppedEnergy) {
            if (containerEnergy) {
                if (creep.pos.getRangeTo(droppedEnergy) < creep.pos.getRangeTo(containerEnergy)) {
                    closestEnergy = droppedEnergy;
                } else {
                    closestEnergy = containerEnergy;
                }
            } else {
                closestEnergy = droppedEnergy;
            }
        } else {
            closestEnergy = containerEnergy;
        }
        
        if (closestEnergy) {
            if (closestEnergy.structureType == STRUCTURE_CONTAINER) {
                if (creep.withdraw(closestEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if (creep.pickup(closestEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }
}

function builder(creep) {
    // if creep is building something and has no energy left
    if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
        // switch state
        creep.memory.building = false;
    } else if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        // switch state
        creep.memory.building = true;
    }

    // if creep is supposed to build something
    if (creep.memory.building) {
        // find closest construction site
        let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    } else {
        let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        let containerEnergy = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        
        let closestEnergy;
        if (droppedEnergy) {
            if (containerEnergy) {
                if (creep.pos.getRangeTo(droppedEnergy) < creep.pos.getRangeTo(containerEnergy)) {
                    closestEnergy = droppedEnergy;
                } else {
                    closestEnergy = containerEnergy;
                }
            } else {
                closestEnergy = droppedEnergy;
            }
        } else {
            closestEnergy = containerEnergy;
        }
        
        if (closestEnergy) {
            if (closestEnergy.structureType == STRUCTURE_CONTAINER) {
                if (creep.withdraw(closestEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if (creep.pickup(closestEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
    }

    let target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (!target) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
}

function hauler(creep) {
    // find dropped energy and pick it up then take it to the spawn
    let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);

    if (droppedEnergy && creep.store.getUsedCapacity() == 0) {
        if (creep.pickup(droppedEnergy) == ERR_NOT_IN_RANGE) {
            creep.moveTo(droppedEnergy, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    } else {
        if (creep.store.getUsedCapacity() > 0) {
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });

                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } else {
                    let containers = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                        }
                    });

                    if (containers) {
                        if (creep.transfer(containers, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(containers, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }
                }
            }
        } else {
            let spawnExtension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            
            // if energy is not full, and there is no dropped energy, take energy from the container
            if (spawnExtension) {
                let containers = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                    }
                });

                if (containers) {
                    if (creep.withdraw(containers, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(containers, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
}
