export const token = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSJ9.cEKegYtd4J9-j2S-P5QMCcOxdtpcDPvtLKU8jfOSauw";
};

export const Endponit = (dev =  true) => {
  return dev ? "http://localhost:8000" : "https://51.38.99.75:4443";
};
