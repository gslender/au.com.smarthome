'use strict';

const { ZigBeeDevice } = require("homey-zigbeedriver");
const { CLUSTER,Cluster, debug } = require('zigbee-clusters');
const TuyaSpecificCluster = require('../../lib/TuyaSpecificCluster');
const TuyaSpecificClusterDevice = require("../../lib/TuyaSpecificClusterDevice");

Cluster.addCluster(TuyaSpecificCluster);

class smart_plug_device extends TuyaSpecificClusterDevice {

  async onNodeInit({ zclNode }) {
    await super.onNodeInit({ zclNode });

    this.log('smart_plug_device has been initialized');

    this.meteringOffset = this.getSetting('metering_offset');
    this.measureOffset = this.getSetting('measure_offset') * 100;
    this.minReportPower= this.getSetting('minReportPower') * 1000;
    this.minReportCurrent = this.getSetting('minReportCurrent') * 1000;
    this.minReportVoltage = this.getSetting('minReportVoltage') * 1000;


    this.registerCapability('onoff', CLUSTER.ON_OFF, { endpoint:  1 });

    // meter_power
    this.registerCapability('meter_power', CLUSTER.METERING, {
      reportParser: value => {
        this.log(`meter_power=${value}`);
        return (value * this.meteringOffset)/100.0;
      },
        
      getParser: value => (value * this.meteringOffset)/100.0,
      getOpts: {
        getOnStart: true,
        pollInterval: 300000
	    }
    });

    // measure_power
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: value => {
        this.log(`measure_power=${value}`);
        return (value * this.measureOffset)/100;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportPower
	    }
    });

    this.registerCapability('measure_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: value => {
        return value/1000;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportCurrent
      }
    });

    this.registerCapability('measure_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: value => {
        return value;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportVoltage
      }
    });

    await zclNode.endpoints[1].clusters.basic.readAttributes(['manufacturerName', 'zclVersion', 'appVersion', 'modelId', 'powerSource', 'attributeReportingStatus'])
    .catch(err => {
        this.error('Error when reading device attributes ', err);
    });
    // debug(true);

    // this.printNode();
    // console.log(zclNode.endpoints);

  }


  onDeleted() {
    this.log("smart_plug_device removed")
  }

}

module.exports = smart_plug_device;
