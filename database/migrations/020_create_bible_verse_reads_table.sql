-- Registro de versículos marcados como lidos (Sala Pastoral / Estudos Bíblicos).
-- Execute no MySQL após fazer backup, se necessário.

CREATE TABLE IF NOT EXISTS bible_verse_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    version VARCHAR(16) NOT NULL COMMENT 'Código da tradução: nvi, acf, ra, ...',
    book_abbrev VARCHAR(32) NOT NULL COMMENT 'Abreviação do livro no catálogo interno',
    chapter SMALLINT UNSIGNED NOT NULL,
    verse SMALLINT UNSIGNED NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_ref (user_id, version, book_abbrev, chapter, verse),
    INDEX idx_user_chapter (user_id, version, book_abbrev, chapter),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
