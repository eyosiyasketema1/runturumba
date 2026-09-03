'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  EMPTY_VERSION,
  EXAMPLE_SKILLS,
  type Skill,
  type SkillVersion,
} from '../../lib/skills-data';

/**
 * One skill list shared by every authoring workflow, so a skill created in
 * the wizard is the same object the guidance workflow and the form edit.
 * That is the point of the comparison — the workflows differ, the data
 * underneath does not.
 */
export interface SkillStore {
  skills: Skill[];
  create: (seed?: Partial<SkillVersion>) => Skill;
  saveDraft: (id: string, version: SkillVersion) => void;
  activate: (id: string, version: SkillVersion) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: Skill['status']) => void;
}

export function useSkillStore(): SkillStore {
  // Seeded with worked examples so each workflow opens on something real.
  const [skills, setSkills] = useState<Skill[]>(EXAMPLE_SKILLS);

  const create = useCallback((seed?: Partial<SkillVersion>) => {
    const draft: SkillVersion = { ...EMPTY_VERSION, ...seed };
    const skill: Skill = {
      id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name || 'Untitled skill',
      description: draft.description,
      status: 'paused',
      active: null,
      draft,
      history: [],
      updatedAt: new Date().toISOString(),
    };
    setSkills((prev) => [...prev, skill]);
    return skill;
  }, []);

  const saveDraft = useCallback((id: string, version: SkillVersion) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: version.name || s.name,
              description: version.description,
              draft: version,
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    );
    toast.success('Draft saved');
  }, []);

  const activate = useCallback((id: string, version: SkillVersion) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextVersion = (s.active?.version ?? 0) + 1;
        return {
          ...s,
          name: version.name || s.name,
          description: version.description,
          status: 'active',
          active: { ...version, version: nextVersion, activatedAt: new Date().toISOString() },
          draft: null,
          history: s.active ? [s.active, ...s.history] : s.history,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    toast.success('Turned on — this version is now live');
  }, []);

  const remove = useCallback((id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    toast.success('Skill deleted');
  }, []);

  const setStatus = useCallback((id: string, status: Skill['status']) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(status === 'active' ? 'Turned on' : 'Paused');
  }, []);

  return { skills, create, saveDraft, activate, remove, setStatus };
}
