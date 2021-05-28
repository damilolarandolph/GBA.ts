export default interface IODevice {
    writeIO(address: u32, value: u32): void;
    readIO(address: u32): u32;
}