import psycopg2
import traceback
from flask import jsonify, g
import logging
from database import get_db_connection
from auth import token_required

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import DB_AVAILABLE from app.py when this module is imported
DB_AVAILABLE = None

@token_required
def get_student_exams():
    """
    Get exams for the current student based on their group.
    This endpoint returns all exams scheduled for the student's group.
    """
    print(f"[DEBUG STUDENT] get_student_exams called by user ID={g.current_user.get('id')} role={g.current_user.get('role')}")
    print(f"[DEBUG STUDENT] Full user data: {g.current_user}")
    print(f"[DEBUG STUDENT] DB_AVAILABLE = {DB_AVAILABLE}")
    
    if not DB_AVAILABLE:
        return jsonify({"error": "Database not available"}), 500
    
    if g.current_user.get('role') != 'STUDENT':
        return jsonify({'error': 'Access denied. Student role required.'}), 403
    
    student_group = g.current_user.get('student_group')
    print(f"[DEBUG STUDENT] Student group: {student_group}")
    
    if not student_group:
        return jsonify({'error': 'Student group not set for this user.'}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query to get all exams for the student's group - based on working SG query
        query = """
            SELECT 
                e.id,
                d.name as discipline_name,
                e.exam_type,
                e.status,
                e.exam_date,
                e.start_hour,
                COALESCE(e.duration, 120) as duration,
                r.id as room_id,
                r.name as room_name,
                u1.full_name as main_teacher,
                u2.full_name as second_teacher
            FROM exams e
            JOIN disciplines d ON e.discipline_id = d.id
            LEFT JOIN rooms r ON e.room_id = r.id
            JOIN users u1 ON e.main_teacher_id = u1.id
            LEFT JOIN users u2 ON e.second_teacher_id = u2.id
            WHERE e.student_group = %s
            ORDER BY e.status, e.exam_date, e.start_hour
        """
        
        print(f"[DEBUG STUDENT] Executing query with student_group={student_group}")
        cursor.execute(query, (student_group,))
        exams = cursor.fetchall()
        print(f"[DEBUG STUDENT] Query executed successfully, fetched {len(exams)} rows")
        
        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        print(f"[DEBUG STUDENT] Columns: {columns}")
        result = []
        for row in exams:
            row_dict = {}
            for i, col in enumerate(columns):
                row_dict[col] = row[i]
            result.append(row_dict)
        
        # Format dates for JSON and prepare teachers array
        for exam in result:
            if exam.get('exam_date'):
                exam['exam_date'] = exam['exam_date'].isoformat()
            
            # Create teachers array from main_teacher and second_teacher
            teachers = []
            if exam.get('main_teacher'):
                teachers.append(exam['main_teacher'])
            if exam.get('second_teacher'):
                teachers.append(exam['second_teacher'])
            exam['teachers'] = teachers
        
        print(f"[DEBUG STUDENT] Found {len(result)} exams for student group {student_group}")
        print(f"[DEBUG STUDENT] First exam (if any): {result[0] if result else 'None'}")
        print(f"[DEBUG STUDENT] Teachers format: {result[0]['teachers'] if result else 'None'}")
        
        
        cursor.close()
        
        return jsonify(result), 200
    
    except Exception as error:
        print(f"Error fetching exams for student: {error}")
        print(traceback.format_exc())
        return jsonify({'error': f'Database error: {str(error)}'}), 500
    finally:
        if conn:
            conn.close()
