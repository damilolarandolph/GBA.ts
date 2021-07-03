const fs = require('fs');
const path = require('path');
const logArrays = require('./log-arrays');

module.exports = {
  /**
   * A set of globs passed to the glob package that qualify typescript files for testing.
   */
  include: ["assembly/__tests__/**/*.spec.ts"],
  /**
   * A set of globs passed to the glob package that quality files to be added to each test.
   */
  add: ["assembly/__tests__/**/*.include.ts"],
  /**
   * All the compiler flags needed for this test suite. Make sure that a binary file is output.
   */
  flags: {
    /** To output a wat file, uncomment the following line. */
    // "--textFile": ["output.wat"],
    /** A runtime must be provided here. */
    "--runtime": ["stub"], // Acceptable values are: "incremental", "minimal", and "stub"
  },
  /**
   * A set of regexp that will disclude source files from testing.
   */
  disclude: [/node_modules/],
  /**
   * Add your required AssemblyScript imports here.
   */
  imports(memory, createImports, instantiateSync, binary) {
    console.log(memory);
    let instance; // Imports can reference this
    // let rom = fs.readFileSync(path.resolve(__dirname, "assembly/__tests__/cpu/roms/ARM_DataProcessing.gba"));
    //let logDir = fs.readdirSync(path.resolve(__dirname, "assembly/__tests__/resources/log-tests/logs"));

    // console.log(rom);
    // let uint8Arr = new Uint8Array(rom);
    const myImports = {
      env: {
        trace: () => { }
      },
      bridge: {
        loadLogRom: (name) => {
          try {
            let str = instance.exports.__getString(name);
            let fileName = path.resolve(__dirname, "assembly/__tests__/resources/log-tests/roms", str + ".gba");
            console.log(fileName);
            let rom = fs.readFileSync(fileName);
            let view = instance.exports.__getUint8ArrayView(instance.exports.getCartData());
            rom.forEach((i, index) => view[index] = i);
          } catch (e) {
            console.log(e);
          }
        },
        testLogReg: (logFile, line, reg) => {
          try {
            let str = instance.exports.__getString(logFile);
            let logValue = logArrays[str][line][reg];
            return logValue;
          } catch (e) {
            console.log(e);
            return 0;
          }
        }
      }
    };
    instance = instantiateSync(binary, createImports(myImports));
    console.log(instance);
    return instance;
  },
  /** Enable code coverage. */
  //coverage: ["assembly/**/*.ts"],
  /**
   * Specify if the binary wasm file should be written to the file system.
   */
  outputBinary: false,
};
