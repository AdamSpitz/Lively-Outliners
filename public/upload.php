<?php
   $module_dir    = 'non-core/uploads';
   $relative_path = 'javascripts/' . $module_dir . '/';

   $target_url = '';
   $base_file_name = basename( $_FILES['fileToUpload']['name']);
   $target_path = getcwd() . '/' . $relative_path . $base_file_name;

   if (@move_uploaded_file($_FILES['fileToUpload']['tmp_name'], $target_path)) {
     $target_url = $relative_path . $base_file_name;
   }
   
   sleep(1);
?>

<script type="text/javascript">window.top.window.transporter.module.Morph.doneUpload('<?php echo $module_dir . '/' . $base_file_name; ?>');</script>
