from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from contextlib import redirect_stderr, redirect_stdout
import io
from django.shortcuts import render
from django.http import HttpResponse
from .models import Problem, TestCase
import subprocess
import uuid
import os
import traceback
import docker


@csrf_exempt
def code_verification(request):
    if (request.method != "POST"):
        return JsonResponse({'error':'Only POST method allowed'}, status=405)
    try:
        data = json.loads(request.body)
        code = data.get('code')
        problem_id = data.get('question_id')

        if not code or not problem_id:
            return JsonResponse({'error': 'Missing code or question_id'}, status=400)
        
        problem = Problem.objects.get(id=problem_id)
        test_cases = TestCase.objects.filter(problem=problem)
        
        test_data = {
            "code": code,
            "function_name": problem.function_name,
            "test_cases": [
                {
                    "input": tc.input_data,
                    "expected": tc.expected_output
                } for tc in test_cases
            ]
        }
        
        temp_dir = f"/tmp/code_runner_{uuid.uuid4()}"
        os.makedirs(temp_dir, exist_ok=True)

        input_path = os.path.join(temp_dir, "input.json")
        output_path = os.path.join(temp_dir, "output.json")

        with open(input_path, "w") as f:
            json.dump(test_data, f)

        # Run Docker container
        # subprocess.run([
        #     "docker", "run",
        #     "--rm",
        #     "-v", f"{temp_dir}:/app/data",
        #     "code-sandbox"
        # ], timeout=10)
        subprocess.run([
            "docker", "run",
            "--rm",
            "--network", "none",                      # No network access
            "--memory", "128m",                       # Memory limit
            "--cpus", "0.5",                          # CPU limit
            "--pids-limit", "64",                     # Limit number of processes
            "--read-only",                            # Container's filesystem is read-only
            "-v", f"{temp_dir}:/app/data",         
            "--security-opt", "no-new-privileges",    # Prevent privilege escalation
            "--user", "1000:1000",                    # Non-root user inside container
            "code-sandbox"
        ], timeout=10)
        
        with open(output_path, "r") as f:
            result_data = json.load(f)

        # Clean up
        subprocess.run(["rm", "-rf", temp_dir])

        if "results" in result_data:
            output_lines = []
            for i, res in enumerate(result_data["results"], 1):
                if res["status"] == "pass":
                    output_lines.append(f"Test case {i}: Passed")
                elif res["status"] == "fail":
                    output_lines.append(
                        f"Test case {i}: Failed\n  Input: {res['input']}\n  Expected: {res['expected']}\n  Got: {res['got']}"
                    )
                elif res["status"] == "error":
                    output_lines.append(
                        f"Test case {i}: Error\n  Message: {res['message']}"
                    )
            output = "\n\n".join(output_lines)
            return JsonResponse({"output": output})

        elif "error" in result_data:
            return JsonResponse({"output": f"Execution error: {result_data['error']}"})
    
    except Problem.DoesNotExist:
        return JsonResponse({'error': 'Problem not found'}, status=404)
    except subprocess.TimeoutExpired:
        return JsonResponse({'error': 'Code execution timed out'}, status=408)
    except Exception as e:
        error_message = f"{str(e)}\n\n{traceback.format_exc()}"
        return JsonResponse({'error': error_message}, status=500)


def problem_list(request):
    problems = Problem.objects.all()
    data = [
        {
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'function_name': p.function_name,
        } for p in problems
    ]
    return JsonResponse(data, safe=False)