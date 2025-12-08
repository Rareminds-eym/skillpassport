import openpyxl

wb = openpyxl.load_workbook('school_student_learning_internships.xlsx')
ws = wb.active

for row in ws.iter_rows(values_only=True):
    print('|'.join([str(cell) if cell is not None else '' for cell in row]))
