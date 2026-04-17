---
name: Document Vault (Kiscsibe Drive)
description: Közös admin/staff dokumentumtár mappákkal, színes címkékkel, csillagozással, automatikus verziókezeléssel és tömeges műveletekkel
type: feature
---
A `/admin/documents` oldal egy belső dokumentumtár (Kiscsibe Drive) admin/staff felhasználóknak. Táblák: `documents`, `document_folders`, `document_tags`, `document_activity`. Storage: privát `documents` bucket. RLS: csak `is_admin_or_staff()`. Feltöltés drag&drop + mobil kamera. Verziókezelés: ugyanolyan név + mappa kombináció esetén az új feltöltés automatikusan új verzióként mentődik (`is_latest_version=false` régi, `version+1` új), parent_document_id láncolva. A grid csak `is_latest_version=true` rekordokat mutat. Tömeges műveletek: kijelölés → áthelyezés mappába / törlés. Csillagozás, ékezetfüggetlen keresés (név+leírás+címke).
