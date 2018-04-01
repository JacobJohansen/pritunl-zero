/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as AuthorityTypes from '../types/AuthorityTypes';
import AuthoritiesStore from '../stores/AuthoritiesStore';
import * as AuthorityActions from '../actions/AuthorityActions';
import NodesStore from "../stores/NodesStore";
import * as NodeActions from "../actions/NodeActions";
import * as NodeTypes from "../types/NodeTypes";
import NonState from './NonState';
import Authority from './Authority';
import Page from './Page';
import PageHeader from './PageHeader';

interface State {
	authorities: AuthorityTypes.AuthoritiesRo;
	nodes: NodeTypes.NodesRo;
	disabled: boolean;
}

const css = {
	header: {
		marginTop: '-19px',
	} as React.CSSProperties,
	heading: {
		margin: '19px 0 0 0',
	} as React.CSSProperties,
	button: {
		margin: '8px 0 0 8px',
	} as React.CSSProperties,
	buttons: {
		marginTop: '8px',
	} as React.CSSProperties,
};

export default class Authorities extends React.Component<{}, State> {
	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			authorities: AuthoritiesStore.authorities,
			nodes: NodesStore.nodes,
			disabled: false,
		};
	}

	componentDidMount(): void {
		AuthoritiesStore.addChangeListener(this.onChange);
		NodesStore.addChangeListener(this.onChange);
		AuthorityActions.sync();
		NodeActions.sync();
	}

	componentWillUnmount(): void {
		AuthoritiesStore.removeChangeListener(this.onChange);
		NodesStore.removeChangeListener(this.onChange);
	}

	onChange = (): void => {
		this.setState({
			...this.state,
			authorities: AuthoritiesStore.authorities,
			nodes: NodesStore.nodes,
		});
	}

	render(): JSX.Element {
		let authoritiesDom: JSX.Element[] = [];

		this.state.authorities.forEach((
				authority: AuthorityTypes.AuthorityRo): void => {
			authoritiesDom.push(<Authority
				key={authority.id}
				nodes={this.state.nodes}
				authority={authority}
			/>);
		});

		return <Page>
			<PageHeader>
				<div className="layout horizontal wrap" style={css.header}>
					<h2 style={css.heading}>Authorities</h2>
					<div className="flex"/>
					<div style={css.buttons}>
						<button
							className="pt-button pt-intent-success pt-icon-add"
							style={css.button}
							disabled={this.state.disabled}
							type="button"
							onClick={(): void => {
								this.setState({
									...this.state,
									disabled: true,
								});
								AuthorityActions.create(null).then((): void => {
									this.setState({
										...this.state,
										disabled: false,
									});
								}).catch((): void => {
									this.setState({
										...this.state,
										disabled: false,
									});
								});
							}}
						>New</button>
					</div>
				</div>
			</PageHeader>
			<div>
				{authoritiesDom}
			</div>
			<NonState
				hidden={!!authoritiesDom.length}
				iconClass="pt-icon-office"
				title="No authorities"
				description="Add a new authority to get started."
			/>
		</Page>;
	}
}
