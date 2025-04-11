def sum_even(values):
    sum = 0
    if(len(values)) == 0:
        return sum
    for val in values:
        if(val % 2 == 0):
            sum += val
    return sum