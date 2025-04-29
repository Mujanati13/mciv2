export const token = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSJ9.cEKegYtd4J9-j2S-P5QMCcOxdtpcDPvtLKU8jfOSauw";
};

export const Endponit = (dev =  false) => {
  return dev ? "http://localhost:8000" : "https://www.jyssrdev.ovh/api";
};
