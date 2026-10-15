from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path('fixtures/mock-v1');root.mkdir(parents=True,exist_ok=True)
image=Image.new('RGB',(1000,750),'white');draw=ImageDraw.Draw(image)
font=ImageFont.truetype('C:/Windows/Fonts/tahoma.ttf',32)
title=ImageFont.truetype('C:/Windows/Fonts/tahomabd.ttf',42)
draw.text((55,45),'MOCK — บิลซื้อสำหรับทดสอบ',font=title,fill='black')
draw.multiline_text((55,140),'ร้านซัพพลายเออร์จำลอง\nวันที่ 14/10/2026\n\nรายการ            จำนวน     หน่วย       รวม (บาท)\nกระเป๋าผ้าสาธิต      6          ชิ้น          780.00\n\nส่วนลด                                            0.00\nยอดรวม                                           780.00\n\nเอกสารจำลอง ไม่ใช่บิลของร้านจริง',font=font,fill='black',spacing=22)
image.save(root/'receipt-thai-mock.png')
print('Synthetic Thai receipt created. Expected quantity 6 / pieces / total780.00; no OCR success assumed.')
