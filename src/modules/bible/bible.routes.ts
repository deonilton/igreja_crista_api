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

export default router;
