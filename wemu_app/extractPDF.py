# import os --> is_valid_file
import os
# pip install filetype --> find_file_type
import filetype as filetype
# from datetime import datetime --> formatDate
from datetime import datetime, timedelta
# pip3 install tabula-py  --> really important for parsing pdf
from tabula import read_pdf


# check if the file exists
def is_valid_file(filePath):
    if os.path.isfile(filePath):
        print(filePath)
        print("File exist")
    else:
        print(filePath)
        print("File does not exist")

# find the file type
def find_file_type(filePath):
    file_type = filetype.guess(filePath)
    if file_type is None:
        print(filePath)
        print('Cannot guess file type!')
        extension = os.path.splitext(filePath)
        print('It is a', extension[1], 'file type')
    print(filePath)
    print('File Extension: %s' % file_type.extension)
    print('File MIME Type: %s' % file_type.mime)

# convert bytes to MB.... GB... etc
def convert_bytes(num):
    for x in ['bytes', 'KB', 'MB', 'GB', 'TB']:
        if num < 1024.0:
            return "%3.1f %s" % (num, x)
        num /= 1024.0

# find the file size
def file_size(filePath):
    if os.path.isfile(filePath):
        file_info = os.stat(filePath)
        return convert_bytes(file_info.st_size)

# format the date into 2019-01-31 12:15:00 format
def formatDate(givenDate):
    format_date = datetime.strptime(givenDate, "%I:%M%p %m/%d/%Y")
    return format_date

# slice the string if it is more than 100 character
def fruit_ninja(s):
    temp_string = s
    if (len(temp_string) <= 100) or (len(temp_string) is None):
        temp_string = temp_string
    else:
        temp_string = temp_string[0:100]
    return temp_string


def extract_fromTabula(pdfPath):
    cf = read_pdf(pdfPath, stream=True, guess=False, pages='all', multiple_tables=True)
    pdf_total_page = len(cf)
    page = 0
    # record_list = [Play_Timestamp, Track_Name, Album_Name, Artist_Name]
    record_list = ["", "", "", "", "", ""]
    temp_record_list = ["", "", "", "", "", ""]

    while page < pdf_total_page:
        prev_str = ""
        prev_str_check = ""
        record_count = 0
        for i in list(cf[page][0]):
            # looking for date
            if "/2019" in str(i) and ":" in str(i):
                record_count = record_count + 1
                prev_str = prev_str[0:18]
                prev_str = prev_str.strip()
                given = prev_str
                if len(given) != 0:
                    formatted = formatDate(given)
                else:
                    formatted = ""
                temp_record_list[0] = formatted
                prev_str = str(i)
                # append to the record
                if record_count > 1:
                    record_list.append(temp_record_list)
                temp_record_list = ["", "", "", "", "", ""]

            # looking for Artist with multi lines info
            if "ARTIST:" in str(i) or ("ARTIST:" in prev_str_check
                        and "ALBUM:" not in str(i)
                        and "htt" not in str(i)
                        and '2019' not in str(i)):
                temp_record_list[2] = temp_record_list[2] + "" + str(i).replace('ARTIST:', '').strip()
                if "ARTIST:" in str(i):
                    temp_record_list[1] = prev_str_check.strip()

            # looking for Album with multi lines info
            if "ALBUM:" in str(i) or ("ALBUM:" in prev_str_check
                        and "LABEL:" not in str(i)
                        and "htt" not in str(i)
                        and '2019' not in str(i)):
                temp_record_list[3] = temp_record_list[3] + "" + str(i).replace('ALBUM:', '').strip()

            # looking for Label with multi lines info
            if "LABEL:" in str(i) or ("LABEL" in prev_str_check
                        and "HOSTS" not in str(i)
                        and "htt" not in str(i)
                        and '2019' not in str(i)):
                temp_record_list[4] = temp_record_list[4] + "" + str(i).replace('LABEL:', '').strip()

            # looking for Host
            if "HOSTS:" in str(i):
                temp_record_list[5] = str(i).replace('HOSTS:', '').strip()

            prev_str_check = str(i)
        page = page + 1

    # do last record
    prev_str = prev_str[0:19]
    temp_record_list[0] = prev_str

    # cycles through list and adds N/A to the missing field.
    for i in range(len(record_list)):
        for j in range(len(record_list[i])):
            if record_list[i][j] == '':
                record_list[i][j] = "N/A"

    # cycles through list and adds 1 seconds to time/date field if duplicates
    previous_time_date = ""
    for i in range(len(record_list)):
        for j in range(len(record_list[i])):
            if j == 0:
                if previous_time_date == record_list[i][0]:
                    # print("*******************Found* duplicate *********   \n", record_list[i][0], "  ", i)
                    record_list[i][0] = record_list[i][0] + timedelta(seconds=1)
                    # print("changed ", record_list[i][0])
                previous_time_date = record_list[i][0]
    # (Play_Timestamp, Track_Name, Album_Name, Artist_Name)
    data_list = []
    for i in range(len(record_list)):
        print_timestamp = ""
        print_track= ""
        print_artist = ""
        print_album = ""

        for j in range(len(record_list[i])):
            temp = record_list[i][j]
            if j == 0:
                print_timestamp = temp
            if j == 1:
                print_track = temp
                print_track = fruit_ninja(print_track)
            if j == 2:
                print_artist = temp
                print_artist = fruit_ninja(print_artist)
            if j == 3:
                print_album = temp
                print_album = fruit_ninja(print_album)

        if print_timestamp != "" and print_track != "":
            data_list.append((str(print_timestamp), print_track, print_album, print_artist))
    # print(data)
    # INSERT INTO Play_Log (Play_Timestamp, Track_Name, Album_Name, Artist_Name) VALUES ('2008-11-11 13:23:44', 'Balls', 'Ballin', 'Balls McBallerson')
    return data_list


# ########## main #########################
if __name__ == '__main__':

    # YOU HAVE TO GO TO THIS SITE AND PULL OUT THE PDF FILE.
    # YOU MUST PULL THE PDFs FROM THIS SITE
    # https://www.wemu.org/now-playing-playlists

    # this pdf have more than 100 char in some place :))
    path = 'C:/Users/Rukiye/Desktop/WEMUpdf.pdf'

    # path = 'C:/Users/Rukiye/Desktop/WEMUpdf2.pdf'
    # path = 'C:/Users/Rukiye/Desktop/WEMUpdf3.pdf'
    # path = 'C:/Users/Rukiye/Desktop/History.pdf'
    # path = 'C:/Users/Rukiye/Desktop/NIST.SP.800-171r1.pdf'

    print('======================================== is_valid_file')
    is_valid_file(path)
    print(' ')

    print('======================================== find_file_type')
    find_file_type(path)
    print(' ')

    print('======================================== file_size')
    file_size(path)
    print(file_size(path))
    print(' ')

    print('======================================== extract_fromTabula')
    data = extract_fromTabula(path)
    print(data)



