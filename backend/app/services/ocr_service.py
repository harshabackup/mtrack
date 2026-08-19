import re
import os
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
from datetime import datetime

def extract_text_from_image(file_path: str) -> str:
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"Error extracting text from image: {e}")
        return ""

def extract_text_from_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        
        # If text is empty, it might be a scanned PDF, so we'd need to OCR the images within it.
        # For simplicity in MVP, we just return the extracted text if any.
        return text
    except Exception as e:
        print(f"Error extracting text from pdf: {e}")
        return ""

def parse_astrology_data(text: str) -> dict:
    data = {}
    
    # Try to extract Name (Basic heuristic: looking for "Name :" or similar)
    name_match = re.search(r'(?:Name|Groom Name|Bride Name)[\s:]*([A-Za-z\s]+)', text, re.IGNORECASE)
    if name_match:
        # Clean up trailing newlines or extra spaces
        data['name'] = name_match.group(1).strip()

    # Try to extract DOB (Looking for common date formats DD-MM-YYYY, DD/MM/YYYY)
    dob_match = re.search(r'(?:Date of Birth|DOB|D.O.B)[\s:]*([\d]{1,2}[-/][\d]{1,2}[-/][\d]{2,4})', text, re.IGNORECASE)
    if dob_match:
        raw_dob = dob_match.group(1).strip()
        formatted_dob = raw_dob
        # Convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
        clean_dob = raw_dob.replace('/', '-')
        for fmt in ('%d-%m-%Y', '%d-%m-%y'):
            try:
                formatted_dob = datetime.strptime(clean_dob, fmt).strftime('%Y-%m-%d')
                break
            except ValueError:
                pass
        data['dob'] = formatted_dob

    # Try to extract Time of Birth
    time_match = re.search(r'(?:Time of Birth|TOB|Time)[\s:]*([\d]{1,2}:[\d]{2}\s*(?:AM|PM|am|pm)?)', text, re.IGNORECASE)
    if time_match:
        data['time'] = time_match.group(1).strip()

    # Try to extract Place of Birth
    place_match = re.search(r'(?:Place of Birth|Place|POB)[\s:]*([A-Za-z\s,]+)', text, re.IGNORECASE)
    if place_match:
        # Limit the match to one line by taking the first line of the result
        place = place_match.group(1).strip().split('\n')[0]
        data['place'] = place

    # Try to extract Rasi
    rasi_match = re.search(r'(?:Rasi|Rashi|Zodiac Sign|Moon Sign)[\s:]*([A-Za-z]+)', text, re.IGNORECASE)
    if rasi_match:
        data['rasi'] = rasi_match.group(1).strip()

    # Try to extract Nakshatra
    nakshatra_match = re.search(r'(?:Nakshatra|Star|Birth Star)[\s:]*([A-Za-z]+)', text, re.IGNORECASE)
    if nakshatra_match:
        data['nakshatra'] = nakshatra_match.group(1).strip()

    # Try to extract Dosham
    dosham_match = re.search(r'(?:Dosham|Manglik|Kuja Dosha)[\s:]*([A-Za-z]+)', text, re.IGNORECASE)
    if dosham_match:
        data['dosham'] = dosham_match.group(1).strip()

    # Try to extract Age
    age_match = re.search(r'(?:Age)[\s:]*(\d{2})', text, re.IGNORECASE)
    if age_match:
        data['age'] = age_match.group(1).strip()

    # Try to extract Current City / Location
    city_match = re.search(r'(?:City|Location|Currently living in|Current City|Living in)[\s:]*([A-Za-z\s]+)', text, re.IGNORECASE)
    if city_match:
        data['city'] = city_match.group(1).strip().split('\n')[0]

    # Try to extract Caste
    caste_match = re.search(r'(?:Caste)[\s:]*([A-Za-z\s]+)', text, re.IGNORECASE)
    if caste_match:
        data['caste'] = caste_match.group(1).strip().split('\n')[0]

    # Try to extract Gotram
    gotram_match = re.search(r'(?:Gotram|Gothram)[\s:]*([A-Za-z\s]+)', text, re.IGNORECASE)
    if gotram_match:
        data['gotram'] = gotram_match.group(1).strip().split('\n')[0]

    # Try to extract Education
    education_match = re.search(r'(?:Education|Qualification|Highest Education)[\s:]*([A-Za-z0-9\.\,\-\s]+)', text, re.IGNORECASE)
    if education_match:
        data['education'] = education_match.group(1).strip().split('\n')[0]

    # Try to extract Job Title
    job_match = re.search(r'(?:Job|Profession|Occupation|Working as)[\s:]*([A-Za-z0-9\.\,\-\s]+)', text, re.IGNORECASE)
    if job_match:
        data['job_title'] = job_match.group(1).strip().split('\n')[0]

    # Try to extract Company
    company_match = re.search(r'(?:Company|Working in|Working at)[\s:]*([A-Za-z0-9\.\,\-\s]+)', text, re.IGNORECASE)
    if company_match:
        data['company'] = company_match.group(1).strip().split('\n')[0]

    # Try to extract Salary
    salary_match = re.search(r'(?:Salary|Income|CTC|Annual Income)[\s:]*([A-Za-z0-9\.\,\-\s]+)', text, re.IGNORECASE)
    if salary_match:
        data['salary_ctc'] = salary_match.group(1).strip().split('\n')[0]

    return data

def process_file_for_ocr(file_path: str, mime_type: str) -> dict:
    if mime_type == 'application/pdf':
        text = extract_text_from_pdf(file_path)
    else:
        text = extract_text_from_image(file_path)
    
    parsed_data = parse_astrology_data(text)
    parsed_data['raw_text'] = text  # Include raw text for debugging/review purposes
    
    return parsed_data
