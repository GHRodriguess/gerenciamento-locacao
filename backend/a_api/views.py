from django.shortcuts import render

# Create your views here.

def scalar_docs(request):
    return render(request, "scalar.html", {
        "schema_url": "schema" 
    })
