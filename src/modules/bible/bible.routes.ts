import { Router } from 'express';
import bibleController from './bible.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeResource('pastoral_room'));

router.get('/verse-of-the-day', bibleController.getVerseOfTheDay);
router.get('/verse', bibleController.getVerse);
router.get('/books', bibleController.getBooks);
router.get('/chapter', bibleController.getChapter);
router.get('/search', bibleController.search);
router.get('/read-progress/by-book', bibleController.getReadProgressByBook);
router.get('/read-progress', bibleController.getReadProgress);
router.post('/read-progress', bibleController.postReadProgress);
router.delete('/read-progress', bibleController.deleteReadProgress);

export default router;
