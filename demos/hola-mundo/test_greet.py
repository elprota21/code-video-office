from greet_fixed import greet

def test_nombre():
    assert greet("Ana") == "Hola, Ana!"

def test_none():
    assert greet(None) == "Hola, mundo!"
