import { error } from '@sveltejs/kit';
import { isLessonId, LESSONS } from '#lib/modules/theory/lessons.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => LESSONS.map((lesson) => ({ lesson }));

export const load: PageLoad = ({ params }) => {
	if (!isLessonId(params.lesson)) error(404, 'Not found');
	return { lesson: params.lesson };
};
