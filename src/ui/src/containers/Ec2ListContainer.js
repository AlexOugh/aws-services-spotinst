import React from 'react';
import Ec2List from '../components/Ec2List';
import API from '../utilities/api';
import SpotInstKeys from '../spotinst/keys';

class Ec2ListContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      accounts: [
      ],
      accountRoleArns: {},
      externalIds: {},
      spotinstAccessKeys: {},
      federateRoleArn: '',
      account: ''
    };
  }

  componentDidMount() {
    const self = this;
    self.setState({spotinstAccessKeys:SpotInstKeys});
    self.find_accounts();
  }

  find_accounts() {
    const self = this;
    const federateAccount = '089476987273';
    const mainRegion = 'us-east-1';
    const url = API.get_msaws_api_url() + '/accounts?account=' + federateAccount + '&region=' + mainRegion;
    const method = 'GET';
    const params = {};
    API.send_request(url, method, params).
    then(function(data) {
      let accountRoleArns = {};
      let externalIds = {};
      data.accounts.map(function(account) {
        accountRoleArns[account.awsid] = account.arn;
        externalIds[account.awsid] = account.externalid;
      })
      self.setState({
        accounts: data.accounts,
        accountRoleArns: accountRoleArns,
        externalIds: externalIds,
        federateRoleArn: data.federateRoleArn
      });
    })
    .catch(function(err) {
      alert(err);
    });
  }

  handleChange(e) {
    const name = e.target.name;
    const value = e.target.value;
    //alert(e.target.name);
    this.setState({
      [name]: value
    });
    //alert(JSON.stringify(this.state));
  }

  handleSubmit(e) {
    if(e) e.preventDefault();
    const self = this;
    const federateAccount = this.state.federateRoleArn.split(":")[4];
    const federateRole = this.state.federateRoleArn.split("/")[1];
    const account = this.state.accountRoleArns[this.state.account].split(":")[4];
    const accountRole = this.state.accountRoleArns[this.state.account].split("/")[1];
    const externalId = this.state.externalIds[this.state.account];
    API.get_federated_creds(federateAccount, account, federateRole, accountRole, externalId).
    then(function(federatedCreds) {
      const url = API.get_api_url() + '/ec2';
      const method = 'POST';
      const params = {
        "federatedCreds": federatedCreds.body.Credentials,
        "region": "us-east-1"
      };
      API.send_request(url, method, params, 'refresh_token').
      then(function(data) {
        if (data.errorMessage) {
          alert(JSON.stringify(data));
          return;
        }
        data.forEach(function(instance) {
          instance.account = self.state.account;
          if (instance.autoScalingGroup) {
            instance.loadBalancerNames = instance.autoScalingGroup.LoadBalancerNames.toString().replace(',', ', ');
          }
          else {
            instance.loadBalancerNames = null;
          }
        });
        self.setState({data: data});
      })
      .catch(function(err) {
        alert(err);
      });
    })
    .catch(function(err) {
      alert(err);
    });
  }

  handleCloudformation(e) {
    e.preventDefault();
    const instanceId = e.target.value;
    const region = e.target.name;
    const federateAccount = this.state.federateRoleArn.split(":")[4];
    const federateRole = this.state.federateRoleArn.split("/")[1];
    const account = this.state.accountRoleArns[this.state.account].split(":")[4];
    const accountRole = this.state.accountRoleArns[this.state.account].split("/")[1];
    const externalId = this.state.externalIds[this.state.account];
    const spotinstAccessKey = this.state.spotinstAccessKeys[this.state.account];
    API.get_federated_creds(federateAccount, account, federateRole, accountRole, externalId).
    then(function(federatedCreds) {
      const params = {
        federatedCreds: federatedCreds.body.Credentials,
        instanceAccount: account,
        instanceId: instanceId,
        instanceRegion: region,
        spotinstAccessKey: spotinstAccessKey
      };
      const self = this;
      const url = API.get_api_url() + '/cloudformation';
      const method = 'POST';
      API.send_request(url, method, params, 'refresh_token').
      then(function(data) {
        if (data.errorMessage) {
          alert(JSON.stringify(data));
          return;
        }
        //self.setState({output: JSON.stringify(data, null, 2)});
        //alert(data.consoleUrl);
        window.open(data.consoleUrl, '_aws');
      })
      .catch(function(err) {
        alert(err);
      });
    })
    .catch(function(err) {
      alert(err);
    });
  }

  render() {
    let changeHandler = this.handleChange.bind(this);
    let submitHandler = this.handleSubmit.bind(this);
    let cloudformationHandler = this.handleCloudformation.bind(this);
    return (<Ec2List data={this.state.data} accounts={this.state.accounts} changeHandler={changeHandler} submitHandler={submitHandler} cloudformationHandler={cloudformationHandler}/>);
  }
}

export default Ec2ListContainer;
