'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { intakeQuestionService } from '@/services/intakeQuestions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiRequestError } from '@/services/requests';
import type { IntakeQuestionSetDto } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  PlusIcon,
  QuestionMarkCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface QuestionFormItem {
  content: string;
  isRequired: boolean;
  placeholder: string;
}

export default function IntakeQuestionsPage() {
  const { role } = useAuth();
  const [sets, setSets] = useState<IntakeQuestionSetDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<IntakeQuestionSetDto | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDefault, setFormDefault] = useState(false);
  const [questions, setQuestions] = useState<QuestionFormItem[]>([
    { content: '', isRequired: true, placeholder: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Detail modal
  const [detailSet, setDetailSet] = useState<IntakeQuestionSetDto | null>(null);

  const fetchSets = async () => {
    try {
      const data = await intakeQuestionService.list();
      setSets(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  if (role !== 'Admin') {
    return (
      <EmptyState
        icon={<QuestionMarkCircleIcon className="h-8 w-8" />}
        title="Không có quyền truy cập"
        description="Chỉ Admin mới có thể quản lý câu hỏi tiếp nhận"
      />
    );
  }

  const openCreate = () => {
    setEditingSet(null);
    setFormName('');
    setFormDesc('');
    setFormDefault(false);
    setQuestions([{ content: '', isRequired: true, placeholder: '' }]);
    setError('');
    setShowModal(true);
  };

  const openEdit = async (set: IntakeQuestionSetDto) => {
    try {
      const detail = await intakeQuestionService.getById(set.id);
      setEditingSet(detail);
      setFormName(detail.name);
      setFormDesc(detail.description || '');
      setFormDefault(detail.isDefault);
      setQuestions(
        detail.questions.map((q) => ({
          content: q.content,
          isRequired: q.isRequired,
          placeholder: q.placeholder || '',
        }))
      );
      setError('');
      setShowModal(true);
    } catch {
      // ignore
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { content: '', isRequired: true, placeholder: '' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionFormItem, value: string | boolean) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleSave = async () => {
    setError('');
    const validQuestions = questions.filter((q) => q.content.trim());
    if (!formName.trim() || validQuestions.length === 0) {
      setError('Tên bộ câu hỏi và ít nhất 1 câu hỏi là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDesc || undefined,
        isDefault: formDefault,
        questions: validQuestions.map((q, i) => ({
          content: q.content,
          orderIndex: i,
          isRequired: q.isRequired,
          placeholder: q.placeholder || null,
        })),
      };

      if (editingSet) {
        await intakeQuestionService.update(editingSet.id, payload);
      } else {
        await intakeQuestionService.create(payload);
      }
      setShowModal(false);
      fetchSets();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bộ câu hỏi này?')) return;
    try {
      await intakeQuestionService.delete(id);
      fetchSets();
    } catch {
      // ignore
    }
  };

  const viewDetail = async (set: IntakeQuestionSetDto) => {
    try {
      const detail = await intakeQuestionService.getById(set.id);
      setDetailSet(detail);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="intake-questions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Câu hỏi tiếp nhận</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Quản lý bộ câu hỏi tự động cho quy trình tiếp nhận yêu cầu
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          Tạo bộ câu hỏi
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <EmptyState
          icon={<QuestionMarkCircleIcon className="h-8 w-8" />}
          title="Chưa có bộ câu hỏi nào"
          description="Tạo bộ câu hỏi đầu tiên để bắt đầu quy trình tiếp nhận tự động"
          action={
            <Button variant="gradient" onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              Tạo bộ câu hỏi
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sets.map((set) => (
            <div
              key={set.id}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 transition-all duration-200 hover:border-[var(--glass-border)]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => viewDetail(set)}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-violet)] transition-colors">
                      {set.name}
                    </h3>
                    {set.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <StarIcon className="h-3 w-3" />
                        Mặc định
                      </span>
                    )}
                  </div>
                  {set.description && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                      {set.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      {set.isActive ? (
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircleIcon className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {set.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                    <span>·</span>
                    <span>{formatDate(set.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(set)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!detailSet}
        onClose={() => setDetailSet(null)}
        title={detailSet?.name || ''}
        size="md"
      >
        {detailSet && (
          <div className="space-y-4">
            {detailSet.description && (
              <p className="text-sm text-[var(--text-muted)]">{detailSet.description}</p>
            )}
            <div className="space-y-2">
              {detailSet.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)] p-3"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-indigo)]/15 text-xs font-semibold text-[var(--accent-violet)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-[var(--foreground)]">{q.content}</p>
                    {q.placeholder && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] italic">
                        {q.placeholder}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      {q.isRequired && (
                        <span className="text-[10px] text-red-400">Bắt buộc</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingSet ? 'Chỉnh sửa bộ câu hỏi' : 'Tạo bộ câu hỏi mới'}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <Input
            id="set-name"
            label="Tên bộ câu hỏi"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="VD: Website Project"
            required
          />
          <Textarea
            id="set-desc"
            label="Mô tả"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Mô tả bộ câu hỏi..."
            rows={2}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formDefault}
              onChange={(e) => setFormDefault(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent-indigo)]"
            />
            <span className="text-[var(--foreground)]">Đặt làm bộ câu hỏi mặc định</span>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--foreground)]">Câu hỏi</label>
              <Button variant="ghost" size="sm" onClick={addQuestion}>
                <PlusIcon className="h-3.5 w-3.5" />
                Thêm câu hỏi
              </Button>
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl bg-[var(--surface-2)] p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-indigo)]/15 text-xs font-semibold text-[var(--accent-violet)] mt-1">
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        value={q.content}
                        onChange={(e) => updateQuestion(i, 'content', e.target.value)}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-indigo)]"
                      />
                      <input
                        value={q.placeholder}
                        onChange={(e) => updateQuestion(i, 'placeholder', e.target.value)}
                        placeholder="Placeholder (gợi ý trả lời)..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-1.5 text-xs text-[var(--text-secondary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-indigo)]"
                      />
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={q.isRequired}
                          onChange={(e) => updateQuestion(i, 'isRequired', e.target.checked)}
                          className="h-3.5 w-3.5 rounded"
                        />
                        <span className="text-[var(--text-muted)]">Bắt buộc</span>
                      </label>
                    </div>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(i)}
                        className="mt-1 rounded-lg p-1 text-[var(--text-muted)] hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-[var(--surface-1)] py-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="gradient" onClick={handleSave} loading={saving}>
              {editingSet ? 'Cập nhật' : 'Tạo bộ câu hỏi'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
