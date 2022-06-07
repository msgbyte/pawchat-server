import { request } from '../request';
import { showToasts, showErrorToasts } from '@capital/common';

/**
 * 加入/创建会议
 */
export async function joinMeeting(meetingId: string) {
  const { data: joinMeetingInfo } = await request.get('getJoinMeetingInfo');

  const { signalingUrl, userId, nickname, avatar } = joinMeetingInfo;

  const { initMeetingClient } = await import('./client');

  const client = initMeetingClient(signalingUrl, userId);

  try {
    await client.join(meetingId, {
      video: false,
      audio: false,
      displayName: nickname,
      picture: avatar,
    });

    // TODO: 接受其他消费者

    showToasts('加入会议成功', 'success');

    return client;
  } catch (err) {
    showErrorToasts(err);
    throw err;
  }
}