var Registry = require('azure-iothub').Registry;
var Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-azure-iot-hub-switch", "AzureSwitch", AzureSwitch);
};

function AzureSwitch(log, config) {
    var self = this;
    self.log = log;
    self.config = config;
    self.name = config["name"];
    self.connectionString = config["connectionString"];
    self.targetDevice = config["targetDevice"];
    self.deviceTwinName = config["deviceTwinName"];
    self.state = false;

    self.registry = Registry.fromConnectionString(self.connectionString);

    this.service = new Service.Switch(this.name);
    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));
}

AzureSwitch.prototype.getOn = function (callback) {
    callback(null, this.state);
};

AzureSwitch.prototype.setOn = function (on, callback) {
    this.state = on ? true : false;
    var self = this;
    var desired = {};
    desired[self.deviceTwinName] = self.state;

    self.registry.getTwin(self.targetDevice, function (err, twin) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(JSON.stringify(twin, null, 2));
            self.twinEtag = twin.etag;

            self.registry.updateTwin(self.targetDevice, { properties: { desired: desired } }, self.twinEtag, function (err, twin) {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log(JSON.stringify(twin, null, 2));
                    self.twinEtag = twin.etag;
                }
            });
        }
    });

    callback(null, on);
};

AzureSwitch.prototype.getServices = function () {
    return [this.service];
};