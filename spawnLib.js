let memoryLib = require('memoryLib');

module.exports.run = function () {
    for(const spawnName in Memory.mySpawns) {
        let spawn = Game.spawns[spawnName];
        let spawnMemory = Memory.mySpawns[spawnName];

        tempData = {
            maxEnergy: spawn.room.energyCapacityAvailable,
            energy: spawn.room.energyAvailable,
            controllerLevel: spawn.room.controller.level,
            creeps: {
                harvester: _.filter(Game.creeps, (creep) => creep.memory.role === "harvester" && creep.memory.dead == false && creep.memory.homeName === spawnMemory.roomName),
                hauler: _.filter(Game.creeps, (creep) => creep.memory.role === "hauler" && creep.memory.homeName === spawnMemory.roomName),
                upgrader: _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader" && creep.memory.homeName === spawnMemory.roomName),
                builder: _.filter(Game.creeps, (creep) => creep.memory.role === "builder" && creep.memory.homeName === spawnMemory.roomName),
                repairer: _.filter(Game.creeps, (creep) => creep.memory.role === "repairer" && creep.memory.homeName === spawnMemory.roomName),
            },
        };

        spawnHavesters(spawn, spawnMemory, tempData);
        spawnHaulers(spawn, spawnMemory, tempData);
        spawnUpgraders(spawn, spawnMemory, tempData);
        spawnBuilders(spawn, spawnMemory, tempData);
        spawnRepairers(spawn, spawnMemory, tempData);

        module.exports.processSpawnQueue();
    }

}

module.exports.addToSpawnQueue = function(spawnId, creepName, bodyParts, memory, priority = 100) {
    let spawnQueue = Memory.spawnQueue || [];
    if (spawnQueue.filter((creep) => creep.name === creepName || creep.memory.role === memory.role).length == 0) {
        // caulcate the cost of the creep
        let cost = 0;
        for (let i = 0; i < bodyParts.length; i++) {
            cost += BODYPART_COST[bodyParts[i]];
        }

        spawnQueue.push({
            name: creepName,
            body: bodyParts,
            priority: priority,
            memory: memory,
            spawnId: spawnId,
            cost: cost,
        });
        spawnQueue.sort((a, b) => a.priority - b.priority);
        Memory.spawnQueue = spawnQueue;
    }
}

module.exports.processSpawnQueue = function() {
    let spawnQueue = Memory.spawnQueue || [];

    if (spawnQueue.length == 0) return;

    let nextCreep = spawnQueue[0];
    let spawn = Game.getObjectById(nextCreep.spawnId);

    if (spawn.spawning == null && spawn.room.energyAvailable >= nextCreep.cost) {
        let result = spawn.spawnCreep(nextCreep.body, nextCreep.name, { memory: nextCreep.memory });

        if (result == OK) {
            spawnQueue.shift();
            Memory.spawnQueue = spawnQueue;
        }
    }
}

function spawnHavesters(spawn, spawnMemory, tempData) {
    let roleName = "harvester";

    // if we have 0 harvesters, spawn one small harvester
    if (tempData.creeps.harvester.length == 0) {
        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, [WORK, CARRY, MOVE], {
            role: roleName,
            sourceId: memoryLib.getNextSource(spawnMemory),
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 0);

        return;
    }

    // find all havesters that are 100 ticks from death
    let dyingHarvesters = tempData.creeps.harvester.filter((creep) => creep.ticksToLive < 100);

    // if we have any dying harvesters, spawn a new one
    if (dyingHarvesters.length > 0) {
        // for each dying harvester, spawn a new one and set them to dead
        for (let i = 0; i < dyingHarvesters.length; i++) {
            let dyingHarvesters = tempData.creeps.harvester[i];
            dyingHarvesters.memory.dead = true;
        }
    }

    let nextSourceId = memoryLib.getNextSource(spawnMemory);
    if (nextSourceId != -1) {
        let bodyParts = [WORK, CARRY, MOVE];
        
        if (tempData.maxEnergy >= 300) {
            bodyParts = [WORK, WORK, CARRY, MOVE];
        }

        if (tempData.maxEnergy >= 400) {
            bodyParts = [WORK, WORK, WORK, CARRY, MOVE];
        }

        if (tempData.maxEnergy >= 500) {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, MOVE];
        }

        if (tempData.maxEnergy >= 600) {
            bodyParts = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
        }

        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, bodyParts, {
            role: roleName,
            sourceId: nextSourceId,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 5);
    }
}

function spawnHaulers(spawn, spawnMemory, tempData) {
    let roleName = "hauler";

    // if we have 0 haulers, spawn one small hauler
    if (tempData.creeps.hauler.length == 0) {
        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, [CARRY, MOVE], {
            role: roleName,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 1);

        return;
    }

    let maxHualers = tempData.creeps.harvester.length * 2;
    if (tempData.creeps.hauler.length < maxHualers) {
        let bodyParts = [CARRY, CARRY, MOVE, MOVE];

        if (tempData.maxEnergy >= 400) {
            bodyParts = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 600) {
            bodyParts = [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 800) {
            bodyParts = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, bodyParts, {
            role: roleName,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 6);
    }
}

function spawnUpgraders(spawn, spawnMemory, tempData) {
    let roleName = "upgrader";

    // if we don't have max upgraders, spawn one
    if (tempData.creeps[roleName].length < Memory.census[roleName + "s"]) {
        let bodyParts = [WORK, CARRY, MOVE];
        
        if (tempData.maxEnergy >= 400) {
            bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 600) {
            bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 800) {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, bodyParts, {
            role: roleName,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 10);
    }
}

function spawnBuilders(spawn, spawnMemory, tempData) {
    let roleName = "builder";

    if (spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0 && tempData.creeps[roleName].length < Memory.census[roleName + "s"]) {
        let bodyParts = [WORK, CARRY, MOVE];
        
        if (tempData.maxEnergy >= 400) {
            bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 600) {
            bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 800) {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, bodyParts, {
            role: roleName,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 15);
    }
}

function spawnRepairers(spawn, spawnMemory, tempData) {
    let roleName = "repairer";

    if (tempData.creeps[roleName].length < Memory.census[roleName + "s"]) {
        let bodyParts = [WORK, CARRY, MOVE];
        
        if (tempData.maxEnergy >= 400) {
            bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 600) {
            bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        }

        if (tempData.maxEnergy >= 800) {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
        }

        module.exports.addToSpawnQueue(spawn.id, spawnMemory.roomName + "_" + roleName + "_" + Game.time, bodyParts, {
            role: roleName,
            homeName: spawnMemory.roomName,
            spawnName: spawnMemory.spawnName,
            dead: false,
        }, 20);
    }
}
