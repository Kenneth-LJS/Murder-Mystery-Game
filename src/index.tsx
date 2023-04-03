import React, { FunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import Page from './components/page';

import './styles/global/_index.scss';

const App: FunctionComponent = (props) => {
    return <Page />;
};

ReactDOM.render(<App />, document.getElementById('root'));
