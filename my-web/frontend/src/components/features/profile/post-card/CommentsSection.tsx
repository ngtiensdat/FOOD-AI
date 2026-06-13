// Mục đích: Sub-component hiển thị phần bình luận của một bài đăng (PostCard), bao gồm viết bình luận mới và phản hồi replies.
// Ý nghĩa: Tách biệt khỏi PostCard.tsx để tuân thủ SRP (SOLID). Cả Forum và Profile đều dùng chung.
'use client';

import React from 'react';
import { Send, AlertOctagon, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/base/Avatar';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';
import { formatTime } from '@/utils/formatters';
import { User, isAdmin } from '@/types/user';
import { CommentData } from '../PostCard';

interface CommentsSectionProps {
  postId: number;
  comments: CommentData[];
  me: Partial<User> | null;
  postAuthorId?: number;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  handleSendComment: (e: React.FormEvent) => void;
  replyingToCommentId: number | null;
  setReplyingToCommentId: (id: number | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleSendReply: (e: React.FormEvent, commentId: number) => void;
  handleDeleteCommentClick: (commentId: number) => void;
  handleDeleteReplyClick: (commentId: number, replyId: number) => void;
  onReport: (targetId: number, targetType: 'POST' | 'COMMENT') => void;
}

export function CommentsSection({
  postId,
  comments,
  me,
  postAuthorId,
  newCommentText,
  setNewCommentText,
  handleSendComment,
  replyingToCommentId,
  setReplyingToCommentId,
  replyText,
  setReplyText,
  handleSendReply,
  handleDeleteCommentClick,
  handleDeleteReplyClick,
  onReport,
}: CommentsSectionProps) {
  const formatCommentDate = (dateStr: string) => formatTime(dateStr);

  return (
    <div className="space-y-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-800 fade-in text-xs font-bold text-gray-600">
      <h5 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
        {LABELS.SOCIAL.COMMENTS_TITLE} ({comments.length})
      </h5>

      {/* Existing Comments list */}
      {comments.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">{LABELS.SOCIAL.NO_COMMENTS}</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 items-start bg-gray-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 relative group">
              <Avatar src={comment.userAvatar} name={comment.userName} size={28} className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 dark:text-slate-100">{comment.userName}</span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {formatCommentDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-normal">{comment.content}</p>
                
                {/* Reply Action */}
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id);
                      setReplyText('');
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    {LABELS.SOCIAL.REPLY}
                  </button>
                </div>

                {/* Inline Reply Form */}
                {replyingToCommentId === comment.id && (
                  <form onSubmit={(e) => handleSendReply(e, comment.id)} className="flex gap-2 mt-2 pt-1.5 border-t border-dashed border-gray-100 dark:border-slate-800">
                    <input
                      type="text"
                      className="form-input !py-1.5 !text-[11px] !px-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                      placeholder={LABELS.SOCIAL.REPLY_PLACEHOLDER(comment.userName)}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-primary hover:bg-primary/95 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {LABELS.SOCIAL.SEND}
                    </button>
                  </form>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-2 mt-2 pt-2 border-t border-gray-100/50 dark:border-slate-800/50">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2 items-start pl-4 border-l border-gray-200 dark:border-slate-700 relative group/reply py-1">
                        <Avatar src={reply.userAvatar} name={reply.userName} size={20} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-[11px] text-gray-800 dark:text-slate-200">{reply.userName}</span>
                            <span className="text-[9px] text-gray-400 font-bold">
                              {formatCommentDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed font-normal">{reply.content}</p>
                        </div>
                        
                        {/* Delete Reply Button */}
                        {(reply.userId === me?.id || postAuthorId === me?.id || isAdmin(me)) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReplyClick(comment.id, reply.id)}
                            className="absolute right-0 top-1 p-0.5 text-gray-300 hover:text-rose-500 opacity-0 group-hover/reply:opacity-100 transition-opacity cursor-pointer"
                            title={LABELS.SOCIAL.DELETE_REPLY}
                            aria-label={LABELS.SOCIAL.DELETE_REPLY}
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete or Report Comment Button */}
              {(comment.userId === me?.id || postAuthorId === me?.id || isAdmin(me)) ? (
                <button
                  onClick={() => handleDeleteCommentClick(comment.id)}
                  className="absolute right-2 bottom-2 p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label={LABELS.SOCIAL.DELETE_COMMENT}
                  title={LABELS.SOCIAL.DELETE_COMMENT}
                >
                  <Trash2 size={12} />
                </button>
              ) : (
                <button
                  onClick={() => onReport(comment.id, 'COMMENT')}
                  className="absolute right-2 bottom-2 p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label={LABELS.SOCIAL.REPORT_COMMENT}
                  title={LABELS.SOCIAL.REPORT_COMMENT}
                >
                  <AlertOctagon size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write Comment Form */}
      <form onSubmit={handleSendComment} className="flex gap-2 mt-2">
        <input
          type="text"
          className="form-input !py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
          placeholder={LABELS.SOCIAL.COMMENT_PLACEHOLDER}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
        />
        <Button variant="primary" type="submit" className="px-4 py-2.5 shadow-md">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
