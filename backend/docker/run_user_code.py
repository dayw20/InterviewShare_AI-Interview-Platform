import json
import sys

def main():
    try:
        with open("data/input.json") as f:
            data = json.load(f)
        
        code = data["code"]
        func_name = data["function_name"]
        test_cases = data["test_cases"]

        exec_env = {}
        exec(code, exec_env)

        if func_name not in exec_env:
            raise Exception(f"Function `{func_name}` not defined.")

        func = exec_env[func_name]

        results = []
        for idx, case in enumerate(test_cases):
            try:
                result = func(*case["input"])
                if result != case["expected"]:
                    results.append({
                        "status": "fail",
                        "input": case["input"],
                        "expected": case["expected"],
                        "got": result
                    })
                else:
                    results.append({"status": "pass"})
            except Exception as e:
                results.append({"status": "error", "message": str(e)})
    
        with open("data/output.json", "w") as f:
            json.dump({"results": results}, f)

    except Exception as e:
        with open("data/output.json", "w") as f:
            json.dump({"error": str(e)}, f)

if __name__ == "__main__":
    main()
