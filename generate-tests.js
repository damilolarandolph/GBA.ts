// A script to generate log test files

const fs = require('fs');
const path = require('path');
const process = require('process');

const MAX_TESTS = process.argv.length > 2 ? process.argv[2] : 10000;
console.log(MAX_TESTS);

const logTestsPath = path.resolve(__dirname, 'assembly/__tests__/resources/log-tests');

let logsDir = fs.readdirSync(path.resolve(logTestsPath, 'logs'));
let romsDir = fs.readdirSync(path.resolve(logTestsPath, 'roms'));

// Making sure the files are in lexographic order
logsDir = logsDir.sort();
romsDir = romsDir.sort();

let logResultFile = `
let logArrays = {};




`


for (let i = 0; i < logsDir.length; ++i) {
    let logFile = fs.readFileSync(path.resolve(logTestsPath, 'logs', logsDir[i]), { encoding: 'utf8', flag: 'r' });
    let lines = logFile.split('\n', MAX_TESTS);
    let fileName = path.parse(logsDir[i]).name;
    let logArrayItem = (line) => {
        let components = [];
        components = line.split(' ');
        let regValues = components.slice(0, 17);
        regValues = regValues.map(i => '0x' + i);
        return "[" + regValues.join(',') + "]";
    }
    let array = `[${lines.map(i => logArrayItem(i)).join(',')}]`;
    logResultFile += `\n logArrays['${fileName}'] = ${array}`;
    let firstComponents = lines[0].split(' ');
    let file = `
import { GBA, cartData } from "../../../gba";
import { loadLogRom, testLogReg } from "../../bridge";
const gba = new GBA();


export function getCartData(): Uint8Array {
    return cartData;
}

let currentLine: u32 = 0;



describe("Log Test for file: ${logsDir[i]}", () => {
  
    beforeAll(() => {
        loadLogRom('${fileName}'); 
        let cpu = gba.getCPU();
        cpu.writeRegister(0, ${parseInt(firstComponents[0], 16)});
        cpu.writeRegister(1, ${parseInt(firstComponents[1], 16)});
        cpu.writeRegister(2, ${parseInt(firstComponents[2], 16)});
        cpu.writeRegister(3, ${parseInt(firstComponents[3], 16)});
        cpu.writeRegister(4, ${parseInt(firstComponents[4], 16)});
        cpu.writeRegister(5, ${parseInt(firstComponents[5], 16)});
        cpu.writeRegister(6, ${parseInt(firstComponents[6], 16)});
        cpu.writeRegister(7, ${parseInt(firstComponents[7], 16)});
        cpu.writeRegister(8, ${parseInt(firstComponents[8], 16)});
        cpu.writeRegister(9, ${parseInt(firstComponents[9], 16)});
        cpu.writeRegister(10, ${parseInt(firstComponents[10], 16)});
        cpu.writeRegister(11, ${parseInt(firstComponents[11], 16)});
        cpu.writeRegister(12, ${parseInt(firstComponents[12], 16)});
        cpu.writeRegister(13, ${parseInt(firstComponents[13], 16)});
        cpu.writeRegister(14, ${parseInt(firstComponents[14], 16)});
        cpu.writeRegister(15, ${parseInt(firstComponents[15], 16) - 4});
        cpu.CPSR = ${parseInt(firstComponents[16], 16)};
    });

    beforeEach(() => {
    })
    afterAll(() => {

            log("Testing line " + (currentLine + 1).toString());
    })
    
    ${`it('Log test for line ', () => {
        let cpu = gba.getCPU();
        for (let i = 0; i < ${lines.length}; ++i) {
            gba.step();
            currentLine = i;
            let PC: u32 = cpu.readRegister(15) - 4;
            expect<u32>(cpu.readRegister(0)).toBe(testLogReg('${fileName}', i, 0), "Equal Reg 0");
            expect<u32>(cpu.readRegister(1)).toBe(testLogReg('${fileName}', i, 1), "Equal Reg 1");
            expect<u32>(cpu.readRegister(2)).toBe(testLogReg('${fileName}', i, 2), "Equal Reg 2");
            expect<u32>(cpu.readRegister(3)).toBe(testLogReg('${fileName}', i, 3), "Equal Reg 3");
            expect<u32>(cpu.readRegister(4)).toBe(testLogReg('${fileName}', i, 4), "Equal Reg 4");
            expect<u32>(cpu.readRegister(5)).toBe(testLogReg('${fileName}', i, 5), "Equal Reg 5");
            expect<u32>(cpu.readRegister(6)).toBe(testLogReg('${fileName}', i, 6), "Equal Reg 6");
            expect<u32>(cpu.readRegister(7)).toBe(testLogReg('${fileName}', i, 7), "Equal Reg 7");
            expect<u32>(cpu.readRegister(8)).toBe(testLogReg('${fileName}', i, 8), "Equal Reg 8");
            expect<u32>(cpu.readRegister(9)).toBe(testLogReg('${fileName}', i, 9), "Equal Reg 9");
            expect<u32>(cpu.readRegister(10)).toBe(testLogReg('${fileName}', i, 10), "Equal Reg 10");
            expect<u32>(cpu.readRegister(11)).toBe(testLogReg('${fileName}', i, 11), "Equal Reg 11");
            expect<u32>(cpu.readRegister(12)).toBe(testLogReg('${fileName}', i, 12), "Equal Reg 12");
            expect<u32>(cpu.readRegister(13)).toBe(testLogReg('${fileName}', i, 13), "Equal Reg 13");
            expect<u32>(cpu.readRegister(14)).toBe(testLogReg('${fileName}', i, 14), "Equal Reg 14");
            expect<u32>(PC).toBe(testLogReg('${fileName}', i, 15), "Equal PC");
            expect<u32>(cpu.CPSR).toBe(testLogReg('${fileName}', i ,16), "Equal CPSR");
        }

    })`
        }
    
});

    `
    //  console.log(file);
    let destination = path.resolve(__dirname, 'assembly/__tests__/cpu/log-tests', fileName + ".spec.ts");
    fs.writeFileSync(destination, file);
}


logResultFile += `\nmodule.exports = logArrays;`;
fs.writeFileSync("log-arrays.js", logResultFile);




console.log(logsDir, romsDir);




