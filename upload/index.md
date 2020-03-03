# /upload/

<form enctype="multipart/form-data" method="post" action="/upload/api">
	<label id="upload-container" for="file">
		<input id="file" type="file" name="files[]" multiple/>
		<span>Choose a file</span>
	</label>
	<br>
	<input placeholder="Name" type="text" name="user" required/>
	<input placeholder="Pass" type="password" name="pass" required/>
	<input type="submit" name="upload" value="Upload"/>
</form>
<br>


---
<br>

You can also use `curl` to upload files:

```bash
#!/bin/fish

set f '/path/to/file'

set i 'username'
set k 'password'

# Upload files.
curl -F "files[]=@$f" -F "user=$i" -F "pass=$k" \
	https://camille.sh/upload/api

# View a list of all uploaded files.
curl -F "view=" -F id="$i" -F key="$k" \
	https://camille.sh/upload/api
```

Alternativly, use [punf](https://github.com/onodera-punpun/punf).
