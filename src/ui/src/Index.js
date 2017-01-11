import React from 'react';
import { render } from 'react-dom';
import { Router, Route, hashHistory } from 'react-router';
import AppContainer from './containers/AppContainer';
import Ec2ListContainer from './containers/Ec2ListContainer';

window.React = React;

render(
  (<Router history={hashHistory}>
    <Route path="/" component={AppContainer}>
      <Route path="/ec2" component={Ec2ListContainer} />
    </Route>
  </Router>), document.getElementById('content')
);
