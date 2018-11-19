using System;
using System.Collections.Generic;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.IO;

public partial class backend_asp_file_Default : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        Response.Clear();

        string action = Request.Params["action"].ToLower();

        if (action.Equals("list"))
        {
            list();
        }

        if (action.Equals("load"))
        {
            load();
        }

        if (action.Equals("save"))
        {
            save();
        }

        Response.End();
    }

    private void list()
    {
        string[] filePaths = Directory.GetFiles(Server.MapPath("data")); 
        foreach (string filePath in filePaths)
        {
            Response.Write(Path.GetFileName(filePath) + "\n");
        }
    }

    private void load()
    {
        string fNaam = "data/" + Request.Params["keyword"].ToLower();
        Response.ContentType = "text/xml";
        if (File.Exists(Server.MapPath(fNaam)))
        {
            Response.WriteFile(Server.MapPath(fNaam));
        }
        else
        {
            Response.StatusCode = 404;
        }
    }

    private void save()
    {
        string fNaam = "data/" + Request.Params["keyword"].ToLower();
        FileStream fs = new FileStream(Server.MapPath(fNaam), FileMode.Create);

        byte[] buffer = new byte[1024];
        int count;
        while ((count = Request.InputStream.Read(buffer, 0, buffer.Length)) != 0)
            fs.Write(buffer, 0, count);

        fs.Close();
        
    }
}
