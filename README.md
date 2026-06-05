# 📚 엄마의 책장 (English PDF Bookshelf)

이 프로젝트는 어머니께서 영어 PDF 교재를 쉽고 편하게 보실 수 있도록 만든 웹 기반 PDF 뷰어입니다.

## 🌟 주요 기능
- **간편한 PDF 열람**: PDF.js를 이용한 부드러운 PDF 뷰어 기능.
- **즐겨찾기**: 자주 보는 책을 하트 버튼으로 따로 모아볼 수 있습니다.
- **검색**: 제목이나 시리즈명으로 책을 빠르게 찾을 수 있습니다.
- **PWA 지원**: 모바일 기기에서 앱처럼 설치하여 사용할 수 있습니다.
- **자동 업데이트**: 새로운 책을 추가한 후 스크립트 하나로 목록을 갱신할 수 있습니다.

## 🚀 새로운 책 추가하는 방법

이제 수동으로 코드를 수정할 필요 없이, 파일만 폴더에 넣고 스크립트를 실행하면 됩니다.

### 1. 파일 넣기
- **PDF 파일**: `BOOK/[시리즈이름]/` 폴더에 PDF 파일을 넣습니다.
- **커버 이미지**: `assets/images/[시리즈이름]/` 폴더에 PDF와 같은 이름의 이미지 파일(jpg, png 등)을 넣습니다.
  - *이미지가 없으면 기본 아이콘이 표시됩니다.*

### 2. 목록 업데이트 스크립트 실행
터미널에서 아래 명령어를 실행하면 `assets/js/bookData.js` 파일이 자동으로 업데이트됩니다.

```bash
python3 scripts/update_books.py
```

### 3. (선택 사항) 상세 정보 설정
시리즈 제목을 직접 지정하거나 책의 레벨, 출판 연도 등을 넣고 싶다면, 해당 시리즈 폴더(`BOOK/[시리즈이름]/`) 안에 `metadata.json` 파일을 만드세요.

**예시 (`BOOK/FamilyAndFriends/metadata.json`):**
```json
{
  "title": "Family & Friends Special Edition",
  "books": {
    "FF 1.pdf": {
      "title": "Family & Friends 1단계",
      "extraInfo": {
        "type": "Student Book",
        "level": "Beginner",
        "year": "2010"
      }
    }
  }
}
```

## 🛠 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Automation**: Python 3
- **PWA**: Service Workers & Web Manifest
