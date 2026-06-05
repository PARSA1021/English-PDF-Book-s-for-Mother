import os
import json
import re
from datetime import datetime

def slugify(text):
    # 슬러그 생성 (id 용)
    return re.sub(r'[\W_]+', '-', text).lower().strip('-')

def main():
    # 프로젝트 루트 디렉토리 설정
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    book_root = os.path.join(base_dir, 'BOOK')
    image_root = os.path.join(base_dir, 'assets', 'images')
    # JS 파일 대신 JSON 파일로 변경하여 동적 로드 용이하게 함
    output_file = os.path.join(base_dir, 'assets', 'js', 'bookData.json')

    book_data_list = []
    
    # 현재 시간 저장 (업데이트 확인용)
    now = datetime.now().isoformat()

    # BOOK 폴더 내의 하위 디렉토리(시리즈) 스캔
    if not os.path.exists(book_root):
        os.makedirs(book_root, exist_ok=True)
        print(f"Info: {book_root} directory created.")

    # 1. 하위 디렉토리(시리즈) 처리
    categories = sorted([d for d in os.listdir(book_root) if os.path.isdir(os.path.join(book_root, d))])
    
    # 2. 루트에 있는 PDF들을 위한 '기타 교재' 카테고리 추가
    root_pdfs = sorted([f for f in os.listdir(book_root) if f.lower().endswith('.pdf')])
    
    all_categories = []
    if root_pdfs:
        all_categories.append(('기타 교재', book_root, root_pdfs))
    
    for cat in categories:
        cat_path = os.path.join(book_root, cat)
        pdf_files = sorted([f for f in os.listdir(cat_path) if f.lower().endswith('.pdf')])
        if pdf_files:
            all_categories.append((cat, cat_path, pdf_files))

    for cat_name, cat_path, pdf_files in all_categories:
        is_root = (cat_path == book_root)
        cat_id = slugify(cat_name) + "-series"
        
        # 타이틀 정제
        if is_root:
            cat_title = "📚 추가된 교재"
        else:
            cat_title = re.sub(r'([a-z])([A-Z])', r'\1 \2', cat_name)
            cat_title = cat_title.replace("And", " & ")
            cat_title = re.sub(r'\s+', ' ', cat_title).strip()
            cat_title = re.sub(r'(&\s*)+', '& ', cat_title).strip()
            if cat_title.endswith('&'): cat_title = cat_title[:-1].strip()
        
        # metadata.json 로드
        metadata = {}
        meta_path = os.path.join(cat_path, 'metadata.json')
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            except Exception: pass

        if 'title' in metadata:
            cat_title = metadata['title']
        
        books = []
        for pdf in pdf_files:
            pdf_full_path = os.path.join(cat_path, pdf)
            # 파일 생성 시간 가져오기
            added_time = os.path.getctime(pdf_full_path)
            added_date = datetime.fromtimestamp(added_time).isoformat()
            
            base_name = os.path.splitext(pdf)[0]
            book_id = slugify(cat_name + "-" + base_name)
            book_title = base_name
            
            # 이미지 찾기
            img_relative_path = "assets/images/icons/icon-512x512.png" # 기본값
            
            # 검색할 이미지 디렉토리 (루트 PDF면 assets/images/ 에서 찾음)
            search_img_dir = os.path.join(image_root, "" if is_root else cat_name)
            
            if os.path.exists(search_img_dir):
                possible_imgs = [f for f in os.listdir(search_img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                clean_base = base_name.replace(" ", "").lower()
                for img in possible_imgs:
                    clean_img_base = os.path.splitext(img)[0].replace(" ", "").lower()
                    if clean_img_base == clean_base:
                        img_relative_path = f"assets/images/{'' if is_root else cat_name + '/'}{img}"
                        break
            
            book_info = metadata.get('books', {}).get(pdf, {})
            books.append({
                "id": book_info.get('id', book_id),
                "title": book_info.get('title', book_title),
                "image": img_relative_path,
                "pdf": f"BOOK/{'' if is_root else cat_name + '/'}{pdf}",
                "addedDate": added_date, # 새로 추가된 날짜
                "extraInfo": book_info.get('extraInfo', {"type": "Student Book", "level": "N/A", "year": "N/A"})
            })
        
        if books:
            book_data_list.append({"id": cat_id, "title": cat_title, "books": books})

    # 최종 데이터 구조
    final_data = {
        "lastUpdated": now,
        "categories": book_data_list
    }

    # bookData.json 파일 생성
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)

    print(f"성공: {output_file} 파일이 업데이트되었습니다.")
    print(f"업데이트 시간: {now}")
    print(f"총 {len(book_data_list)}개 시리즈, {sum(len(c['books']) for c in book_data_list)}권의 책을 찾았습니다.")

if __name__ == "__main__":
    main()
