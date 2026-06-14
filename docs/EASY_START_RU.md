# Быстрый старт без кода

## 1. Как редактировать сайт

Откройте:

`https://ВАШ-САЙТ.vercel.app/admin.html`

В админке можно менять:

- имя;
- фото;
- email и телефон;
- текст на LV/RU/EN;
- работы в портфолио;
- опыт;
- ссылки Instagram/Vimeo/Behance;
- Cloudinary настройки.

После изменений нажмите **Save changes**.

## 2. Как добавить работу

1. Откройте `/admin.html`.
2. Перейдите в **Works**.
3. Нажмите **Add work**.
4. Заполните title, category, year, role и description.
5. Добавьте poster URL и video/image URL.
6. Нажмите **Save changes**.

## 3. Как загрузить фото или видео через Cloudinary

Один раз в Cloudinary:

1. Зайдите в Settings.
2. Создайте unsigned upload preset.
3. Скопируйте cloud name и upload preset.
4. Вставьте их в `/admin.html` → **Settings**.
5. Нажмите **Save changes**.

После этого в Works можно нажимать **Upload** и выбирать файл с компьютера.

## 4. Как работает сохранение

Админка сохраняет изменения в GitHub-файл:

`content/site.json`

Vercel автоматически обновляет сайт после сохранения.

Для сохранения нужен GitHub fine-grained token:

- repository access: только этот репозиторий;
- permission: Contents → Read and write.

Токен можно не запоминать в браузере: просто вставляйте его только когда хотите сохранить.

## 5. Что важно

- Не загружайте тяжелые видео в GitHub.
- Храните видео и большие фото в Cloudinary.
- В GitHub/Vercel должны лежать только сайт, маленькие poster images и `content/site.json`.
