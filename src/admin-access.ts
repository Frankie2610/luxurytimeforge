import type {AdminRole} from './permissions';

export type AdminMemberStatus='active'|'suspended';
export type AdminInvitationStatus='pending'|'accepted'|'cancelled'|'expired';

export interface AdminMemberRecord{
  uid:string;
  email:string;
  name:string;
  role:AdminRole;
  status:AdminMemberStatus;
  inviteId?:string;
  invitedAt?:string;
  acceptedAt?:string;
  updatedAt:string;
}

export interface AdminInvitationRecord{
  id:string;
  email:string;
  name:string;
  role:Exclude<AdminRole,'owner'>;
  status:AdminInvitationStatus;
  invitedBy:string;
  invitedByName:string;
  createdAt:string;
  expiresAt:string;
  acceptedAt?:string;
  acceptedBy?:string;
  cancelledAt?:string;
  deliveryStatus?:'sent'|'failed';
  deliveryError?:string;
  lastSentAt?:string;
  continueUrl?:string;
}

export const ADMIN_MEMBERS_PATH='timeforge/adminMembers';
export const ADMIN_INVITATIONS_PATH='timeforge/adminInvitations';
export const adminMemberPath=(uid:string)=>`${ADMIN_MEMBERS_PATH}/${uid}`;
export const adminInvitationPath=(id:string)=>`${ADMIN_INVITATIONS_PATH}/${id}`;

export const normalizeEmail=(value:string)=>value.trim().toLowerCase();
export const inviteExpired=(invite:AdminInvitationRecord)=>Date.now()>new Date(invite.expiresAt).getTime();
export const activeMember=(value:unknown):value is AdminMemberRecord=>{
  if(!value||typeof value!=='object')return false;
  const member=value as Partial<AdminMemberRecord>;
  return Boolean(member.uid&&member.email&&member.status==='active'&&member.role);
};
