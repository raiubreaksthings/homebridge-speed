const SpeedTest = require('speedtest-net');

module.exports = function (homebridge) {
  const Accessory = homebridge.platformAccessory;
  const Characteristic = homebridge.hap.Characteristic;

  class InternetSpeedAccessory {
    constructor(log, config) {
      this.log = log;
      this.config = config;
      this.interval = this.config.interval || 3600 * 1000; // default to one hour

      // Set up the accessory information
      this.accessory = new Accessory('Internet Speed', homebridge.hap.uuid.generate('homebridge-internet-speed'));
      this.accessory.addService(homebridge.hap.Service.AccessoryInformation, 'Internet Speed');

      // Set up the firmware revision characteristic
      this.firmwareRevision = this.accessory.getService(homebridge.hap.Service.AccessoryInformation)
        .getCharacteristic(Characteristic.FirmwareRevision);

      // Set up the switch characteristic
      this.switch = this.accessory.addService(homebridge.hap.Service.Switch, 'Internet Speed')
        .getCharacteristic(homebridge.hap.Characteristic.On);

      // Set up the interval timer
      this.intervalTimer = setInterval(this.runSpeedTest.bind(this), this.interval);

      // Run the initial speed test
      this.runSpeedTest();
    }

    runSpeedTest() {
      this.switch.updateValue(true);

      const speedTest = SpeedTest({ maxTime: 5000 });

      speedTest.on('data', (data) => {
        const downloadSpeed = data.speeds.download;
        const uploadSpeed = data.speeds.upload;
        const pingTime = data.server.ping;

        this.log(`Internet speed test results: ${downloadSpeed} Mbps download, ${uploadSpeed} Mbps upload, ${pingTime} ms ping`);

        this.firmwareRevision.updateValue(`${downloadSpeed} Mbps down, ${uploadSpeed} Mbps up`);
      });

      speedTest.on('error', (err) => {
        this.log(`Internet speed test failed: ${err.message}`);
      });

      speedTest.on('end', () => {
        this.switch.updateValue(false);
      });

      speedTest.start();
    }

    getServices() {
      return [this.accessory];
    }
  }

  homebridge.registerAccessory('homebridge-internet-speed', 'InternetSpeed', InternetSpeedAccessory);
};
