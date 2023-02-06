module.exports.run = function () {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    if (Memory.mySpawns == undefined) {
        Memory.mySpawns = {};
    }

    if (Memory.census == undefined) {
        Memory.census = {
            upgraders: 5,
            builders: 4,
            repairers: 0,
            wallRepairers: 0,
            miners: 0,
            claimers: 0,
            reservers: 0,
            scouts: 0,
        };
    }

    for (let spawnName in Game.spawns) {
        if (Memory.mySpawns[spawnName] != undefined) {
            return Memory.mySpawns[spawnName];
        }

        let spawn = Game.spawns[spawnName];

        let firstSource = true;
        let source1MaxHarvesters = 0;
        let source2MaxHarvesters = 0;
        let source1 = false;
        let source2 = false;

        for (let source of spawn.room.find(FIND_SOURCES)) {
            let roomTerrain = Game.map.getRoomTerrain(spawn.room.name);
            let x = source.pos.x;
            let y = source.pos.y;

            for (let i = x - 1; i <= x + 1; i++) {
                for (let j = y - 1; j <= y + 1; j++) {
                    if (i == x && j == y) continue;
                    let terrain = roomTerrain.get(i, j);
                    if (terrain != TERRAIN_MASK_WALL) {
                        if (firstSource) source1MaxHarvesters++;
                        if (!firstSource) source2MaxHarvesters++;
                        // this.room.visual.text('O', i, j, {align: 'center', opacity: 0.8});
                    } else {
                        // this.room.visual.text('X', i, j, {align: 'center', opacity: 0.8});
                    }
                }
            }

            if (source != undefined && firstSource) {
                source1 = source.id;
            } else if (source != undefined && !firstSource) {
                source2 = source.id;
            }

            firstSource = false;
        }

        Memory.mySpawns[spawnName] = {
            spawnName: spawn.name,
            roomName: spawn.room.name,
            controllerId: spawn.room.controller.id,
            source1Id: source1,
            source2Id: source2,
            sourceCount: spawn.room.find(FIND_SOURCES).length,
            source1MaxHarvesters: source1MaxHarvesters,
            source2MaxHarvesters: source2MaxHarvesters,
            lastSourceSelected: 0,
        }
    }
}

module.exports.getNextSource = function(spawnMemory) {
    var source1Creeps = _.filter(Game.creeps, (creep) => {
        return creep.memory.homeName == spawnMemory.roomName && creep.memory.sourceId == spawnMemory.source1Id && creep.memory.dead == false;
    });
    
    var source2Creeps = _.filter(Game.creeps, (creep) => {
        return creep.memory.homeName == spawnMemory.roomName && creep.memory.sourceId == spawnMemory.source2Id && creep.memory.dead == false;
    });
    
    // if number of creeps is equal to max, return -1
    if (source1Creeps.length >= spawnMemory.source1MaxHarvesters && source2Creeps.length >= spawnMemory.source2MaxHarvesters) {
         return -1;
    }
        
    var nextSource = (source1Creeps.length + source2Creeps.length) % 2 === 0 ? spawnMemory.source1Id : spawnMemory.source2Id;
    
    // make sure we don't have more than the max number of harvesters for the next source
    if (nextSource === spawnMemory.source1Id && source1Creeps.length >= spawnMemory.source1MaxHarvesters) {
        nextSource = spawnMemory.source2Id;
    } else if (nextSource === spawnMemory.source2Id && source2Creeps.length >= spawnMemory.source2MaxHarvesters) {
        nextSource = spawnMemory.source1Id;
    }

    return nextSource;
  };
  