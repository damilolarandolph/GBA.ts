export default interface IODevice {
    writeIO(address: u32, value: u8): void;
    readIO(address: u32): u8;
}