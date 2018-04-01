/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as AuthorityTypes from '../types/AuthorityTypes';
import * as NodeTypes from "../types/NodeTypes";
import * as AuthorityActions from '../actions/AuthorityActions';
import PageInput from './PageInput';
import PageSwitch from './PageSwitch';
import PageInputButton from './PageInputButton';
import AuthorityDeploy from './AuthorityDeploy';
import PageTextArea from './PageTextArea';
import PageInfo from './PageInfo';
import PageSave from './PageSave';
import ConfirmButton from './ConfirmButton';
import Help from './Help';

interface Props {
	nodes: NodeTypes.NodesRo;
	authority: AuthorityTypes.AuthorityRo;
}

interface State {
	disabled: boolean;
	changed: boolean;
	message: string;
	authority: AuthorityTypes.Authority;
	addRole: string;
}

const css = {
	card: {
		position: 'relative',
		padding: '10px 10px 0 10px',
		marginBottom: '5px',
	} as React.CSSProperties,
	remove: {
		position: 'absolute',
		top: '5px',
		right: '5px',
	} as React.CSSProperties,
	item: {
		margin: '9px 5px 0 5px',
		height: '20px',
	} as React.CSSProperties,
	itemsLabel: {
		display: 'block',
	} as React.CSSProperties,
	itemsAdd: {
		margin: '8px 0 15px 0',
	} as React.CSSProperties,
	group: {
		flex: 1,
		minWidth: '250px',
	} as React.CSSProperties,
	save: {
		paddingBottom: '10px',
	} as React.CSSProperties,
	label: {
		width: '100%',
		maxWidth: '280px',
	} as React.CSSProperties,
	inputGroup: {
		width: '100%',
	} as React.CSSProperties,
	protocol: {
		flex: '0 1 auto',
	} as React.CSSProperties,
	port: {
		flex: '1',
	} as React.CSSProperties,
};

export default class Authority extends React.Component<Props, State> {
	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			disabled: false,
			changed: false,
			message: '',
			authority: null,
			addRole: null,
		};
	}

	set(name: string, val: any): void {
		let authority: any;

		if (this.state.changed) {
			authority = {
				...this.state.authority,
			};
		} else {
			authority = {
				...this.props.authority,
			};
		}

		authority[name] = val;

		this.setState({
			...this.state,
			changed: true,
			authority: authority,
		});
	}

	toggle(name: string): void {
		let authority: any;

		if (this.state.changed) {
			authority = {
				...this.state.authority,
			};
		} else {
			authority = {
				...this.props.authority,
			};
		}

		authority[name] = !authority[name];

		this.setState({
			...this.state,
			changed: true,
			authority: authority,
		});
	}

	onSave = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		AuthorityActions.commit(this.state.authority).then((): void => {
			this.setState({
				...this.state,
				message: 'Your changes have been saved',
				changed: false,
				disabled: false,
			});

			setTimeout((): void => {
				if (!this.state.changed) {
					this.setState({
						...this.state,
						message: '',
						changed: false,
						authority: null,
					});
				}
			}, 3000);
		}).catch((): void => {
			this.setState({
				...this.state,
				message: '',
				disabled: false,
			});
		});
	}

	onDelete = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		AuthorityActions.remove(this.props.authority.id).then((): void => {
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
	}

	onAddRole = (): void => {
		let authority: AuthorityTypes.Authority;

		if (this.state.changed) {
			authority = {
				...this.state.authority,
			};
		} else {
			authority = {
				...this.props.authority,
			};
		}

		let roles = [
			...authority.roles,
		];

		if (!this.state.addRole) {
			return;
		}

		if (roles.indexOf(this.state.addRole) === -1) {
			roles.push(this.state.addRole);
		}

		roles.sort();

		authority.roles = roles;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addRole: '',
			authority: authority,
		});
	}

	onRemoveRole(role: string): void {
		let authority: AuthorityTypes.Authority;

		if (this.state.changed) {
			authority = {
				...this.state.authority,
			};
		} else {
			authority = {
				...this.props.authority,
			};
		}

		let roles = [
			...authority.roles,
		];

		let i = roles.indexOf(role);
		if (i === -1) {
			return;
		}

		roles.splice(i, 1);

		authority.roles = roles;

		this.setState({
			...this.state,
			changed: true,
			message: '',
			addRole: '',
			authority: authority,
		});
	}

	render(): JSX.Element {
		let authority: AuthorityTypes.Authority = this.state.authority ||
			this.props.authority;
		let info: AuthorityTypes.Info = authority.info || {};
		let url: string = window.location.protocol + '//' +
			window.location.host + '/ssh_public_key/' + authority.id;

		let roles: JSX.Element[] = [];
		for (let role of authority.roles) {
			roles.push(
				<div
					className="pt-tag pt-tag-removable pt-intent-primary"
					style={css.item}
					key={role}
				>
					{role}
					<button
						className="pt-tag-remove"
						onMouseUp={(): void => {
							this.onRemoveRole(role);
						}}
					/>
				</div>,
			);
		}

		let tokens: JSX.Element[] = [];
		for (let token of this.props.authority.host_tokens || []) {
			tokens.push(
				<PageInputButton
					key={token}
					buttonClass="pt-minimal pt-intent-danger pt-icon-remove"
					type="text"
					hidden={!authority.host_certificates}
					readOnly={true}
					autoSelect={true}
					listStyle={true}
					buttonDisabled={this.state.changed}
					buttonConfirm={true}
					value={token}
					onSubmit={(): void => {
						AuthorityActions.deleteToken(
								this.props.authority.id, token).then((): void => {
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
				/>,
			);
		}

		return <div
			className="pt-card"
			style={css.card}
		>
			<div className="layout horizontal wrap">
				<div style={css.group}>
					<div style={css.remove}>
						<ConfirmButton
							className="pt-minimal pt-intent-danger pt-icon-cross"
							progressClassName="pt-intent-danger"
							confirmMsg="Confirm authority remove"
							disabled={this.state.disabled}
							onConfirm={this.onDelete}
						/>
					</div>
					<PageInput
						label="Name"
						help="Name of authority"
						type="text"
						placeholder="Enter name"
						value={authority.name}
						onChange={(val): void => {
							this.set('name', val);
						}}
					/>
					<PageTextArea
						readOnly={true}
						label="Public Key"
						help="Certificate authority public key in SSH format"
						placeholder="Public key"
						rows={10}
						value={authority.public_key}
						onChange={(val: string): void => {
							this.set('key', val);
						}}
					/>
					<PageSwitch
						label="Host certificates"
						help="Allow servers to validate and sign SSH host keys."
						checked={authority.host_certificates}
						onToggle={(): void => {
							this.toggle('host_certificates');
						}}
					/>
					<PageSwitch
						label="Strict host checking"
						help="Enable strict host checking for SSH clients connecting to servers in this domain."
						hidden={!authority.host_certificates}
						checked={authority.strict_host_checking}
						onToggle={(): void => {
							this.toggle('strict_host_checking');
						}}
					/>
					<PageInput
						label="Host Domain"
						help="Domain that will be used for SSH host certificates. All servers must have a subdomain registered on this domain."
						type="text"
						placeholder="Host domain"
						value={authority.host_domain}
						onChange={(val): void => {
							let authr: AuthorityTypes.Authority;

							if (this.state.changed) {
								authr = {
									...this.state.authority,
								};
							} else {
								authr = {
									...this.props.authority,
								};
							}

							authr.host_domain = val;

							this.setState({
								...this.state,
								changed: true,
								authority: authr,
							});
						}}
					/>
					<PageInput
						label="Bastion Host"
						help="Optional username and hostname of bastion host to proxy client connections for this domain. If the bastion station requires a specific username it must be included such as 'ec2-user@server.domain.com'. Bastion hostname does not need to be in host domain. If strict host checking is enabled bastion host must have a valid certificate."
						type="text"
						placeholder="Bastion host"
						value={authority.host_proxy}
						onChange={(val): void => {
							this.set('host_proxy', val);
						}}
					/>
					<AuthorityDeploy
						disabled={this.state.disabled}
						nodes={this.props.nodes}
						authority={authority}
					/>
				</div>
				<div style={css.group}>
					<PageInfo
						fields={[
							{
								label: 'ID',
								value: authority.id || 'None',
							},
							{
								label: 'Algorithm',
								value: info.key_alg || 'None',
							},
						]}
					/>
					<PageInput
						label="Download URL"
						help="Public download url for the authority public key. Can be used to wget public key onto servers. Multiple public keys can be downloaded by seperating the IDs with a comma."
						type="text"
						placeholder="Enter download URL"
						readOnly={true}
						autoSelect={true}
						value={url}
					/>
					<PageInput
						label="Certificate Expire Minutes"
						help="Number of minutes until certificates expire. The certificate only needs to be active when initiating the SSH connection. The SSH connection will stay connected after the certificate expires. Must be greater then 1 and no more then 1440."
						type="text"
						placeholder="Certificate expire minutes"
						value={authority.expire}
						onChange={(val): void => {
							this.set('expire', parseInt(val, 10));
						}}
					/>
					<PageInput
						label="Host Certificate Expire Minutes"
						help="Number of minutes until host certificates expire. Must be greater then 14 and no more then 1440."
						type="text"
						placeholder="Host certificate expire minutes"
						hidden={!authority.host_certificates}
						value={authority.host_expire}
						onChange={(val): void => {
							this.set('host_expire', parseInt(val, 10));
						}}
					/>
					<PageSwitch
						label="Match roles"
						help="Require a matching role with the user before giving a certificate. If disabled all users will be given a certificate from this authority. The certificate principles will only contain the users roles."
						checked={authority.match_roles}
						onToggle={(): void => {
							this.toggle('match_roles');
						}}
					/>
					<label className="pt-label" hidden={!authority.match_roles}>
						Roles
						<Help
							title="Roles"
							content="Roles associated with this authority. If at least one role matches the user will be given a certificate from this authority. The certificate principles will only contain the users roles."
						/>
						<div>
							{roles}
						</div>
					</label>
					<PageInputButton
						buttonClass="pt-intent-success pt-icon-add"
						label="Add"
						type="text"
						placeholder="Add role"
						hidden={!authority.match_roles}
						value={this.state.addRole}
						onChange={(val): void => {
							this.setState({
								...this.state,
								addRole: val,
							});
						}}
						onSubmit={this.onAddRole}
					/>
					<label
						style={css.itemsLabel}
						hidden={!authority.host_certificates}
					>
						Host Tokens
						<Help
							title="Host Tokens"
							content="Tokens that servers can use to validate and sign SSH host keys. Changes must be saved before modifying tokens."
						/>
					</label>
					{tokens}
					<button
						className="pt-button pt-intent-success pt-icon-add"
						style={css.itemsAdd}
						type="button"
						disabled={this.state.changed}
						hidden={!authority.host_certificates}
						onClick={(): void => {
							AuthorityActions.createToken(
									this.props.authority.id).then((): void => {
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
						}}>
						Add Token
					</button>
				</div>
			</div>
			<PageSave
				style={css.save}
				hidden={!this.state.authority}
				message={this.state.message}
				changed={this.state.changed}
				disabled={this.state.disabled}
				light={true}
				onCancel={(): void => {
					this.setState({
						...this.state,
						changed: false,
						authority: null,
					});
				}}
				onSave={this.onSave}
			/>
		</div>;
	}
}
